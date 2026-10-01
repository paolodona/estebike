---
name: wa-gallery-pull
description: Download images from the EsteBike WhatsApp groups (Estebike + AGONISTI TEAM) and update the gallery page. Use --backfill to capture older/missed images.
---

# WhatsApp Gallery Pull

Downloads new images from **both** EsteBike WhatsApp groups via Chrome DevTools MCP and saves them to `public/images/gallery/YYYY/MM/`.

The heavy lifting lives in `scripts/whatsapp-gallery/`:

- `browser/md5.mjs` — MD5 implementation injected into the WhatsApp tab
- `browser/switch-chat.mjs` — robust chat-switcher (synthetic mouse events, header validation)
- `browser/open-media-panel.mjs` — opens "Media, links and docs", dismisses promo popovers, reports per-month loaded/not-loaded counts
- `browser/init-state.mjs` — seeds `window.__waKnown` / `window.__waDownloaded` on the tab
- `browser/scroll-and-download.mjs` — scroll the panel, hash each blob, and **download new ones inline** while the blob URL is still hot; throttled; capped per call
- `make-scripts.mjs` — Node helper: writes every injection above to a folder, ready to pass to `evaluate_script`
- `process-downloads.mjs` — hash dedup, rename, move (per month), descriptions, state
- `pull.mjs` — post-pull CLI (process + cleanup + summary, optional build)

**Why download inline (single pass)?** WhatsApp Web revokes a blob URL once its media item scrolls out of the hot set or after a short idle. The old two-pass design captured blob URLs first and re-fetched them later, so the URLs were dead by the time the Node round-trip finished (`Failed to fetch`). Now each new blob is fetched, hashed, and saved in the same injected call — no blob URL has to survive a round-trip. The authoritative dedup against the full `known_hashes` still happens in `process-downloads.mjs`.

**Arguments:** `$ARGUMENTS`

- No args = pull only NEW images, stopping early when a streak of known images is hit
- `--backfill` = scan all media items in the panel (no streak abort)
- `--dry-run` = run the processor in dry-run mode after downloads (no state changes)

## Prerequisites

- Chrome DevTools MCP connected, WhatsApp Web logged in.

## Flow

### 1. Check session

Run `list_pages`. If `web.whatsapp.com` is not open, navigate to it. If the page shows a QR code (`canvas[aria-label*="QR"]` / `[data-ref]`) rather than `#pane-side`, ask the user to scan it (phone → Settings → Linked devices → Link a device) and wait for confirmation.

**Freshly linked device:** right after linking, WhatsApp Web **reloads itself** once it finishes the initial sync (typically within the first minute or two). Before step 2, wait until `#pane-side` is present and `performance.now()` is well past that (or simply wait ~30s after the chat list appears), otherwise the reload wipes the run state mid-pull. Step 3's `no-init` handling covers a reload that happens anyway.

### 2. Generate the injections and seed run state

```bash
node scripts/whatsapp-gallery/make-scripts.mjs --out-dir <scratchpad>/wa-inject [--backfill]
```

Pass `--backfill` in backfill mode (it bakes `backfill: true` into the `sd-*.js` files). This writes `init.js`, `switch-estebike.js`, `switch-agonisti.js`, `open-media-panel.js`, `sd-estebike.js`, `sd-agonisti.js`. **Each file is a complete function declaration** — read it and pass its contents verbatim as the `function` argument of `evaluate_script` (use `waitForStableDom: false`).

Inject `init.js` and verify `{ ok: true, known: > 0 }`. It sets:

- `window.__waKnown` — MD5s of the images in the most recent 3 gallery month folders (`--months N` to change). Used for the known-streak early-stop. It deliberately does **not** use a tail slice of `pull-state.json#known_hashes`: `delete-selected`, `filter-existing` and `import-export` re-sort that array alphabetically, so its tail is not "recent".
- `window.__waDownloaded` — hashes of `wapull_*` files already in `~/Downloads` (empty on a clean start). Accumulates across batches and both groups so nothing is downloaded twice.

Do **not** re-inject `init.js` between groups unless the state was lost (see `no-init` below).

### 3. For each group: switch → open media panel → scroll-and-download

Groups, in order: **Estebike** (`switch-estebike.js`, `sd-estebike.js`), then **AGONISTI TEAM Estebike** (`switch-agonisti.js`, `sd-agonisti.js`). Before switching to the second group, close the media panel with the MCP `press_key` tool (`Escape`).

For each group:

1. **Switch chat.** Inject `switch-<group>.js`. Verify `{ ok: true, header: ... }`. Retry once on `header-mismatch`.
2. **Open media panel.** Inject `open-media-panel.js`. Verify `{ ok: true, imageItems: > 0 }`. It closes promo popovers such as "New: Calling on web" — those are also `div[role="dialog"]` and used to hide the media panel from every script (`imageItems: 0`). Note the `months` breakdown, e.g. `{ "September": { loaded: 24, notLoaded: 16 }, "August": { loaded: 0, notLoaded: 58 } }`, for the report.
3. **Scroll & download (looped).** Inject `sd-<group>.js`. Each call re-scrolls from the top, skips anything already in `window.__waDownloaded`, hashes the rest, and downloads up to 12 **new** images inline, returning `{ downloaded, scanned, errors, reachedCap, aborted, finalStreak, skippedKnown, notLoaded, ... }`.

   **Loop the call** for the same group until it stops yielding work:
   - `reachedCap: true` → it hit the per-call download cap; **call again** (more remain).
   - `reachedCap: false` → it reached the panel bottom; the group is done.
   - `aborted: true` → a known-hash streak fired (default mode); the group is done.
   - `{ ok: false, error: 'no-init' }` → WhatsApp Web reloaded and wiped the run state. Re-run `make-scripts.mjs` (so `init.js` picks up the `wapull_*` files already saved), inject the new `init.js`, then redo switch → open panel → scroll for the current group.

   Track the last call's `aborted` / `finalStreak` / `notLoaded` and the running `downloaded` total per group for the report.

Saved files land in `~/Downloads/` as `wapull_{group}_{md5}_m{YYYY-MM}_{slug}.jpg`. `m{YYYY-MM}` is the media-panel month section the image sat under. The naming is idempotent — re-running on the same image always produces the same filename, so any rate-limited Chrome retry overwrites the previous attempt cleanly.

### 4. Process and report

Run the post-pull CLI:

```bash
node scripts/whatsapp-gallery/pull.mjs --verify
```

`--verify` also runs `astro build` and prints the result. Each image goes to the gallery folder of **its own month** (from the filename), so one pull can fill several months. `--month YYYY-MM` forces every file into one folder — only needed for legacy files without the month tag.

The CLI:

- Hashes each download, skips known/cross-group duplicates, renames to `estebike_NNN_slug.jpg` (numbering continues per month folder), moves to the gallery folder
- Generates an Italian alt-text in `descriptions.json`
- Updates `pull-state.json` (`last_pull`, `total_downloaded`, `known_hashes`, `months_with_images`, per-group counts)
- Cleans up any leftover `wapull_*` / `estebike_*` / `agonisti_*` files
- Optionally runs the build
- Prints a single-screen summary with per-month counts

### 5. Report to the user

Take the CLI summary and add per-group context from each group's final `scroll-and-download` call, e.g.:

> Estebike: 8 new (stopped after 15-known streak). AGONISTI TEAM: 0 new (panel exhausted). 56 known dupes skipped. Build OK.

If any group ended with `notLoaded > 0`, say so with the per-month breakdown from step 3.2 — those images were **not** pulled (see "Not-yet-downloaded media" below).

## Behavior notes

- **Inline download (no dead blobs).** `scroll-and-download` fetches, hashes, and saves each new blob in the same injected call, so a blob URL never has to survive a round-trip to Node. This is the whole reason for the single-pass design — see "Why download inline" above.
- **Throttling.** It waits 1.2s between downloads and 2s every 5 to dodge Chrome's silent multi-download rate limit. Don't lower these without testing.
- **Per-call cap + loop.** Each call downloads at most 12 so a single `evaluate_script` stays under its timeout. Loop the call while `reachedCap` is true; stop on `reachedCap: false` (bottom) or `aborted: true` (known streak). `window.__waDownloaded` makes the re-scroll skip already-grabbed images.
- **Early stop.** Default abort threshold is 15 consecutive `window.__waKnown` hits. `__waKnown` holds the hashes of the recent gallery month folders — enough because the panel is newest-first. With `--backfill` the streak rule is skipped.
- **Media dialog selection.** Every script picks the `div[role="dialog"]` with the most list items, never the first one — promo popovers are dialogs too.
- **Scroller is layout-independent.** `findScroller` prefers the scrollable element that wraps the media dialog, falling back to the right-most scrollable div, so it works on narrow and wide windows and in the side-panel layout.
- **Not-yet-downloaded media.** A freshly linked device only has the newest media; older thumbnails show WhatsApp's download arrow and carry a low-res `data:` preview instead of a `blob:` URL. The scripts skip these and count them as `notLoaded`. Clicking the arrows programmatically (`.click()`, synthetic pointer events, or a DevTools `click` on the button uid) did **not** trigger the fetch in testing. Ask the user to keep the phone online and click a few arrows by hand in the WhatsApp tab; if they start loading, re-run with `--backfill`.
- **History limit.** A linked device only sees history back to roughly when it was linked ("Use WhatsApp on your phone to see messages from before …" at the bottom of the panel). Older images can't be pulled from WhatsApp Web at all — use `import-export.mjs` with a chat export instead.
- **Virtual scroll.** WhatsApp keeps ~95 image blobs hot at any time. The loop scrolls in 400px steps and retries a few times at the bottom to let WA stream older blobs; for older content use `--backfill`.
- **Deleted images.** Hashes stay in `known_hashes` even when files are deleted from the gallery — this is intentional: a deleted image is a rejected image.
- **Blob URL lifetime.** Blob URLs are valid only for the current WhatsApp Web session and only while their item is in the hot set. Don't navigate away mid-pull.
- **Escape key.** Use the MCP `press_key` tool, not synthetic KeyboardEvents — WhatsApp Web ignores dispatched key events.
- **No viewer needed.** Media-panel thumbnails already carry the full-resolution blob URL; never click a thumbnail to "open" it.
- **Sequential numbering after rename.** Browser files use the hash; the processor renames to `estebike_NNN_slug.jpg` keyed on the highest existing index in each destination month. Both groups merge into a single sequence per month (matches the legacy convention).

## Backfill mode

Backfill is the same single-pass flow with one difference: generate the scripts with `make-scripts.mjs --backfill`, so the consecutive-known-streak abort is skipped and every new hash gets downloaded. Month folders are picked per image automatically.

WhatsApp will progressively fetch older blobs as you scroll, so backfill may take 5–10 minutes per group (many looped `scroll-and-download` calls).
