---
name: wa-gallery-pull
description: Download images from the EsteBike WhatsApp groups (Estebike + AGONISTI TEAM) and update the gallery page. Use --backfill to capture older/missed images.
---

# WhatsApp Gallery Pull

Downloads new images from **both** EsteBike WhatsApp groups via Chrome DevTools MCP and saves them to `public/images/gallery/YYYY/MM/`.

The heavy lifting lives in `scripts/whatsapp-gallery/`:

- `browser/md5.mjs` — MD5 implementation injected into the WhatsApp tab
- `browser/switch-chat.mjs` — robust chat-switcher (synthetic mouse events, header validation)
- `browser/open-media-panel.mjs` — opens "Media, links and docs"
- `browser/scroll-and-hash.mjs` — **Pass 1**: scroll the panel, fetch every blob, return `{ blobUrl, hash, label }` list (no downloads)
- `browser/download-list.mjs` — **Pass 2**: download a pre-filtered list of new blobs, throttled
- `process-downloads.mjs` — hash dedup, rename, move, descriptions, state
- `pull.mjs` — post-pull CLI (process + cleanup + summary, optional build)

**Why two passes?** The browser script no longer needs the full `known_hashes` list (~3,800 entries → 120KB inlined). Pass 1 returns the small hash list; the orchestrator filters in Node; Pass 2 downloads only the new ones. Each injected script stays under ~10KB.

Each `browser/*.mjs` exports either `MD5_SOURCE` (a string) or a `toScript(args)` function returning a JS source string ready to pass to `evaluate_script`.

**Arguments:** `$ARGUMENTS`

- No args = pull only NEW images, stopping early when a streak of known images is hit
- `--backfill` = scan all media items in the panel (no streak abort)
- `--dry-run` = run the processor in dry-run mode after downloads (no state changes)

## Prerequisites

- Chrome DevTools MCP connected, WhatsApp Web logged in.

## Flow

### 1. Check session

Run `mcp chrome-devtools list_pages`. If `web.whatsapp.com` is not listed, navigate to it and ask the user to confirm login.

### 2. For each group: switch → open media panel → scroll-and-download

Groups, in order:

| groupName                | query           | headerMatch              |
| ------------------------ | --------------- | ------------------------ |
| `Estebike`               | `Estebike`      | `Estebike`               |
| `AGONISTI TEAM Estebike` | `AGONISTI TEAM` | `AGONISTI TEAM Estebike` |

For each group:

1. **Switch chat.** Read `scripts/whatsapp-gallery/browser/switch-chat.mjs`, call `toScript({ groupName, query, headerMatch })`, pass the returned source to `evaluate_script`. Verify the result is `{ ok: true, header: ... }`. Retry once on `header-mismatch`.
2. **Open media panel.** Read `browser/open-media-panel.mjs`, call `toScript()`, inject. Verify `{ ok: true, imageItems: > 0 }`.
3. **Pass 1 — scroll & hash.** Read `browser/scroll-and-hash.mjs` (also reads `browser/md5.mjs`). Call `toScript()`, inject, await. You get `{ items: [{ blobUrl, hash, label }] }`.
4. **Filter in Node.** Build the list of `{ blobUrl, hash, label }` whose `hash` is NOT in `pull-state.json#known_hashes`. For default mode, also stop the list as soon as `abortStreak` (default 15) consecutive entries are known — `items` is in newest-first order, so a streak signals we've hit already-downloaded territory. With `--backfill`, do not apply the streak rule.
5. **Pass 2 — download.** Read `browser/download-list.mjs`. Call `toScript({ group, toDownload })` with the filtered list. Inject and await. You get `{ attempted, downloaded, errors }`.

Saved files land in `~/Downloads/` as `wapull_{group}_{md5}_{slug}.jpg`. The naming is idempotent — re-running on the same image always produces the same filename, so any rate-limited Chrome retry overwrites the previous attempt cleanly.

### 3. Process and report

Run the post-pull CLI:

```bash
node scripts/whatsapp-gallery/pull.mjs --verify
```

`--verify` also runs `astro build` and prints the result. Use `--month YYYY-MM` to deposit into a non-current month (backfill).

The CLI:

- Hashes each download, skips known/cross-group duplicates, renames to `estebike_NNN_slug.jpg`, moves to the gallery folder
- Generates an Italian alt-text in `descriptions.json`
- Updates `pull-state.json` (`last_pull`, `total_downloaded`, `known_hashes`, `months_with_images`, per-group counts)
- Cleans up any leftover `wapull_*` / `estebike_*` / `agonisti_*` files
- Optionally runs the build
- Prints a single-screen summary

### 4. Report to the user

Take the CLI summary and add per-group context from the `aborted` and `finalStreak` fields returned by each `scroll-and-download` invocation, e.g.:

> Estebike: 8 new (stopped after 15-known streak). AGONISTI TEAM: 0 new (panel exhausted). 56 known dupes skipped. Build OK.

## Behavior notes

- **Throttling.** `download-list` waits 1.2s between downloads and 2s every 5 to dodge Chrome's silent multi-download rate limit. Don't lower these without testing.
- **Early stop.** Default abort threshold is 15 consecutive known-hash hits, applied during Node-side filtering of the Pass 1 results. With `--backfill` the streak rule is skipped.
- **Virtual scroll.** WhatsApp keeps ~95 image blobs hot at any time. The loop scrolls in 400px steps; for older content use `--backfill` (the panel will fetch as you scroll).
- **Deleted images.** Hashes stay in `known_hashes` even when files are deleted from the gallery — this is intentional: a deleted image is a rejected image.
- **Blob URL lifetime.** Blob URLs are valid only for the current WhatsApp Web session. The whole flow must run end-to-end without navigating away.
- **Escape key.** Use the MCP `press_key` tool, not synthetic KeyboardEvents — WhatsApp Web ignores dispatched key events.
- **No viewer needed.** Media-panel thumbnails already carry the full-resolution blob URL; never click a thumbnail to "open" it.
- **Sequential numbering after rename.** Browser files use the hash; the processor renames to `estebike_NNN_slug.jpg` keyed on the highest existing index in the destination month. Both groups merge into a single sequence (matches the legacy convention).

## Backfill mode

Backfill is the same two-pass flow with two differences:

1. The Node-side filter step (between Pass 1 and Pass 2) skips the consecutive-known-streak abort, so every new hash gets queued.
2. Optionally pass `--month YYYY-MM` to `pull.mjs` to deposit into the historical folder.

WhatsApp will progressively fetch older blobs as you scroll, so backfill may take 5–10 minutes per group.
