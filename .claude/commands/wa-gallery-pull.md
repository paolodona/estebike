---
name: wa-gallery-pull
description: Download images from the EsteBike WhatsApp groups (Estebike + AGONISTI TEAM) and update the gallery page. Use --backfill to capture older/missed images.
---

# WhatsApp Gallery Pull

Download new images from **both** EsteBike WhatsApp groups via Chrome DevTools MCP, save them to the gallery, and update `galleria.astro`.

**Groups to pull from (in this order):**

1. **"Estebike"** — the main group chat
2. **"AGONISTI TEAM Estebike"** — the agonisti/racing team group

Both groups share the same gallery folders, dedup hash list, and descriptions file. Process them sequentially: complete all steps for group 1, then repeat for group 2.

**Arguments:** `$ARGUMENTS`

- No args = pull only NEW images (posted after last pull date)
- `--backfill` = re-scan all media to capture previously missed images
- `--dry-run` = scan and report what would be downloaded without saving

## Prerequisites

- Chrome DevTools MCP must be connected
- User must be logged into WhatsApp Web
- The EsteBike group chat must be accessible

## Overall flow

Steps 1–2 run once at the start. Then steps 3–10 are executed **for each group** in sequence:

1. Read state & connect to WhatsApp (once)
2. **For "Estebike" group:** navigate → open media → extract → download → move → describe → update state
3. **For "AGONISTI TEAM Estebike" group:** navigate → open media → extract → download → move → describe → update state
4. Verify build & report (once)

The shared `known_hashes` ensures cross-group dedup: any image already downloaded from group 1 is automatically skipped in group 2.

## Step-by-step process

### 1. Read current state

Read `scripts/whatsapp-gallery/pull-state.json` to get:

- `last_pull` — ISO timestamp of the last successful pull (per-group, see `groups` object)
- `total_downloaded` — number of unique images in the gallery (across both groups)
- `known_hashes` — MD5 hashes of ALL images ever downloaded from ANY group (the authoritative dedup list, shared across groups)
- `months_with_images` — which months already have images
- `groups` — per-group state with `last_pull` and `total_downloaded` for each group

**Important — deleted image handling:** The `known_hashes` array is the single source of truth for deduplication. If a hash is in `known_hashes`, the image must NEVER be re-downloaded, even if the file no longer exists on disk. A missing file with a known hash means the user intentionally deleted it. Do NOT remove hashes from `known_hashes` and do NOT re-download images whose hash is already known.

**Important — cross-group dedup:** The same image may be shared in both groups. Since `known_hashes` is shared, once an image is downloaded from the first group, it will be automatically skipped when encountered in the second group. This prevents duplicates in the gallery.

Read the current gallery page `src/pages/galleria.astro` to understand the existing image entries and month sections.

### 2. Connect to WhatsApp Web

Use Chrome DevTools MCP tools to:

1. **Check if WhatsApp is already open:**

   ```
   mcp chrome-devtools list_pages
   ```

   Look for a page with `web.whatsapp.com` in the URL.

2. **If not open, navigate to it:**

   ```
   mcp chrome-devtools navigate_page url="https://web.whatsapp.com"
   ```

   Then ask the user to log in and confirm when ready.

3. **Navigate to the target group:**

   Process groups in order. For each group, search and navigate:

   **Group 1 — "Estebike" (main group):**
   - Use `fill` on the search box to type "Estebike"
   - Click the "Estebike" group chat (NOT "AGONISTI TEAM Estebike", "@ Dublin", or "ESTEBIKE" contact)
   - Verify the chat header shows "Estebike" with member list

   **Group 2 — "AGONISTI TEAM Estebike":**
   - After completing all steps for Group 1 (through step 10), return here
   - Clear the search box and type "AGONISTI TEAM"
   - Click the "AGONISTI TEAM Estebike" group chat
   - Verify the chat header shows "AGONISTI TEAM Estebike" with member list
   - Then repeat steps 3–10 for this group

### 3. Open the Media Panel

1. Click the group header (use `evaluate_script` to find `[data-testid="contact-info-header"]` or `[title="Profile details"]` and click it)
2. Wait 1.5s for the Group Info panel to appear
3. Find and click "Media, links and docs" span (search all `<span>` elements for this exact text, then click the closest parent button/div)
4. Wait 2s for the media panel dialog to appear
5. Verify: `document.querySelector('div[role="dialog"]')` should exist

### 4. Determine what to download

**Default mode (new images only):**

- The media panel shows images newest-first
- Count the total image listitems: `dialog.querySelectorAll('[role="listitem"]')` where `aria-label` includes "Image"
- Compare with `pull-state.json.total_downloaded`
- The difference = new images to download (they'll be at the top of the panel)

**Backfill mode (`--backfill`):**

- Download ALL images, deduplicating against existing files by MD5 hash
- Will need multiple scroll passes since virtual scroll only renders ~85 items at once

### 5. Extract blob URLs AND message captions

The media panel renders image thumbnails as CSS `background-image: url("blob:...")` on `<div>` elements. These blob URLs contain the **full-resolution** images (not just thumbnails).

Each listitem's `aria-label` contains the sender name and any attached message caption (e.g., `" Image from GloriaBel panorama dai colli"`). Extract both the sender AND the caption text for use as image descriptions.

**Collection script** (inject via `evaluate_script`):

```javascript
async () => {
  const dialog = document.querySelector('div[role="dialog"]');
  if (!dialog) return { error: 'No media dialog' };

  const allDivs = document.querySelectorAll('div');
  const blobMap = {};
  for (const div of allDivs) {
    const bg = getComputedStyle(div).backgroundImage;
    if (bg && bg.includes('blob:')) {
      const match = bg.match(/url\("(blob:[^"]+)"\)/);
      if (match) {
        const li = div.closest('[role="listitem"]');
        const label = li?.getAttribute('aria-label') || '';
        if (label.includes('Image')) {
          blobMap[match[1]] = label.substring(0, 120);
        }
      }
    }
  }
  return { count: Object.keys(blobMap).length, blobs: blobMap };
};
```

**Download script** (inject via `evaluate_script`):

```javascript
async (blobMap, startIndex) => {
  const entries = Object.entries(blobMap);
  let downloaded = 0,
    errors = 0;

  for (let i = 0; i < entries.length; i++) {
    const [blobUrl, label] = entries[i];
    try {
      const sender = (label.match(/from\s+(.+?)(?:$)/) || ['', 'unknown'])[1]
        .replace(/[^a-zA-Z0-9 ]/g, '')
        .trim()
        .replace(/\s+/g, '_')
        .substring(0, 20);
      const idx = String(startIndex + i).padStart(3, '0');
      const filename = `estebike_${idx}_${sender}.jpg`;

      const response = await fetch(blobUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 500);
      downloaded++;
      if (i % 10 === 9) await new Promise((r) => setTimeout(r, 500));
    } catch (e) {
      errors++;
    }
  }
  return { downloaded, errors, total: entries.length };
};
```

**For backfill mode**, after the first pass:

1. Store collected blob URLs
2. Scroll the media panel container (find div with `scrollHeight > 5000`) from top to bottom in 200px steps with 250ms delays
3. Collect any NEW blob URLs not in the first pass
4. Download the new ones

### 6. Move files from Downloads to gallery

After the browser downloads complete (wait 5-10 seconds):

```bash
# Compute MD5 hashes of newly downloaded files
cd ~/Downloads
for f in estebike_*.jpg; do [[ "$f" == *"("* ]] && continue; md5sum "$f"; done
```

For each downloaded file:

1. Compute its MD5 hash
2. Check if the hash exists in `pull-state.json`'s `known_hashes` array
3. **If hash is known → DELETE the downloaded file** (it was either already in the gallery or was intentionally removed by the user — either way, skip it)
4. **If hash is new → move to gallery** and add hash to `known_hashes`

Move unique new files to `public/images/gallery/YYYY/MM/` based on their month, renumbering sequentially from the current max index + 1 within that month folder.

**Folder structure**: `public/images/gallery/{year}/{month}/estebike_NNN_sender.jpg`

- Example: `public/images/gallery/2026/03/estebike_046_Gloria.jpg`
- The gallery page auto-scans this directory structure — no need to edit `galleria.astro` for new images.

### 7. Determine month for new images

The media panel organizes images by month with headers (MARCH, FEBRUARY, JANUARY, etc.). Map new images to months using:

- **Position in the media panel**: Images at the top are newest (current month)
- **If only a few new images**: They're likely all from the current month
- **For backfill**: Use the snapshot data from the media panel to map positions to month headers

Month name mapping for Italian gallery labels:

- JANUARY → Gennaio
- FEBRUARY → Febbraio
- MARCH → Marzo
- APRIL → Aprile
- MAY → Maggio
- etc.

### 8. Generate Italian descriptions and update descriptions.json

For each new image, generate an Italian alt-text description and store it in `scripts/whatsapp-gallery/descriptions.json`. This file maps filenames to descriptions and is read by `galleria.astro` at build time.

**Description sources (in priority order):**

1. **WhatsApp message caption** — the text attached to the image in the chat. Extract from the listitem `aria-label`:
   - Label format: `" Image from {Sender}{OptionalCaption}"`
   - The caption is the text after the sender name (if any)
   - Example: `" Image from GloriaBel panorama dai colli"` → caption is "Bel panorama dai colli"
   - Example: `" Image from Nicola"` → no caption

2. **AI-generated description** — if no caption, look at the image (use Claude's vision via `Read` tool on the image file) and write a brief Italian description (max 10 words) describing what's in the photo. Focus on: what activity, where, who (if identifiable by jersey/kit).

3. **Fallback** — if neither is available, use: `"{SenderName} - uscita in bici"` or `"Foto dal gruppo EsteBike"` for unknown senders.

**Language and content rules:**

- ALL descriptions MUST be in Italian
- Replace any profanity/vulgar words with `***`. Common Italian profanity to catch:
  `cazzo`, `minchia`, `merda`, `stronzo/a`, `vaffanculo`, `coglione`, `porca/porco` (when used as expletive), `madonna` (when used as expletive), `dio` (when used as expletive, e.g. "dio \*\*\*"), `azz` (euphemism)
- Also check for English profanity: `fuck`, `shit`, `damn`, `ass`, `bitch`, `hell` (when used as expletive)
- Keep descriptions concise: max 80 characters
- Use sentence case, no trailing period
- No emoji in descriptions

**Update process:**

```python
import json

# Read existing descriptions
desc_path = 'scripts/whatsapp-gallery/descriptions.json'
descriptions = json.load(open(desc_path))

# For each new image file, add entry
# Key = filename (e.g., "estebike_046_Gloria.jpg")
# Value = Italian description string
descriptions["estebike_046_Gloria.jpg"] = "Bel panorama dai Colli Euganei"

# Remove the _comment key if present before saving, then re-add
descriptions.pop('_comment', None)
descriptions = {"_comment": "Maps image filename to Italian alt text. Auto-generated by /wa-gallery-pull.", **descriptions}

json.dump(descriptions, open(desc_path, 'w'), indent=2, ensure_ascii=False)
```

### 9. Gallery page auto-updates

The gallery page (`src/pages/galleria.astro`) auto-scans `public/images/gallery/YYYY/MM/` at build time. **No manual editing needed** — just placing files in the right folder is enough. The page:

- Reads `scripts/whatsapp-gallery/descriptions.json` for alt text (if entry exists for a filename)
- Falls back to generating alt text from the sender name in the filename
- Generates month sections from folder names (e.g., `2026/03` → "Marzo 2026")
- Sections sorted newest-first
- All alt text is in Italian

### 10. Update pull state

Update `scripts/whatsapp-gallery/pull-state.json`:

- Set top-level `last_pull` to current ISO timestamp
- Update `total_downloaded` with new total count (across both groups)
- Add new hashes to `known_hashes` (never remove existing ones)
- Update `months_with_images` with new month counts
- Update the `groups` object with per-group `last_pull` and `total_downloaded`:
  ```json
  "groups": {
    "Estebike": { "last_pull": "2026-04-01T...", "total_downloaded": 65 },
    "AGONISTI TEAM Estebike": { "last_pull": "2026-04-01T...", "total_downloaded": 12 }
  }
  ```
  Update each group's entry only after successfully processing that group.

### 11. Verify

Run `npx astro build 2>&1 | tail -5` to ensure the site builds without errors.

Report to the user:

- Number of new images downloaded **per group** (e.g., "Estebike: 5 new, AGONISTI TEAM: 3 new")
- Number of cross-group duplicates skipped
- Which months they were added to
- Current total gallery count
- Number of descriptions generated (from captions vs AI vs fallback)
- Any profanity that was censored
- Any errors or skipped items

### 12. Clean up Downloads

After successful copy and verification:

```bash
rm ~/Downloads/estebike_*.jpg
```

## Important notes

- **Virtual scroll limitation**: WhatsApp Web only renders ~85 media items at once. A single pass may not capture all images. The backfill option handles this with multiple scroll passes.
- **Blob URL lifetime**: Blob URLs are only valid during the current WhatsApp Web session. You cannot save URLs for later — download in the same session.
- **Escape key**: Do NOT use `document.dispatchEvent(new KeyboardEvent('keydown', {key:'Escape'}))` to close viewers — it doesn't work in WhatsApp Web. Use the MCP `press_key` tool instead, or avoid opening the viewer entirely (download blobs directly from the media panel).
- **Deduplication**: Always deduplicate by MD5 hash against `known_hashes` in `pull-state.json`, not by filename or blob URL. Never remove entries from `known_hashes`.
- **Deleted images**: If a user deletes an image file from the gallery, its hash stays in `known_hashes`. This is intentional — it prevents re-downloading rejected images. The gallery page auto-excludes missing files since it scans the filesystem.
- **No viewer needed**: The blob URLs in the media panel thumbnails already contain full-resolution images. There is no need to click thumbnails to open a viewer.
