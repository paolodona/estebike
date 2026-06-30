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
- `browser/init-state.mjs` — seeds `window.__waKnown` / `window.__waDownloaded` on the tab (injected once)
- `browser/scroll-and-download.mjs` — scroll the panel, hash each blob, and **download new ones inline** while the blob URL is still hot; throttled; capped per call
- `make-init.mjs` — Node helper: writes the `init-state` injection from the recent slice of `known_hashes`
- `process-downloads.mjs` — hash dedup, rename, move, descriptions, state
- `pull.mjs` — post-pull CLI (process + cleanup + summary, optional build)

**Why download inline (single pass)?** WhatsApp Web revokes a blob URL once its media item scrolls out of the hot set or after a short idle. The old two-pass design captured blob URLs first and re-fetched them later, so the URLs were dead by the time the Node round-trip finished (`Failed to fetch`). Now each new blob is fetched, hashed, and saved in the same injected call — no blob URL has to survive a round-trip. The known-hash early-stop still works: a **recent slice** of `known_hashes` (not all ~3,800) is seeded onto `window` once via `make-init.mjs`, so each batch injection stays small. The authoritative dedup against the full `known_hashes` still happens in `process-downloads.mjs`.

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

### 2. Seed run state (once)

Generate the `init-state` injection from the recent slice of `known_hashes` and inject it **once**, before any group:

```bash
node scripts/whatsapp-gallery/make-init.mjs --out <scratchpad>/init-state.js
```

Read that file and pass its contents to `evaluate_script`. Verify `{ ok: true, known: > 0 }`. This sets `window.__waKnown` (recent gallery hashes, for the early-stop) and `window.__waDownloaded` (empty; accumulates across batches and across both groups so nothing is downloaded twice). Do **not** re-inject it between groups — that would clear `__waDownloaded`.

### 3. For each group: switch → open media panel → scroll-and-download

Groups, in order:

| groupName                | query           | headerMatch              | group arg  |
| ------------------------ | --------------- | ------------------------ | ---------- |
| `Estebike`               | `Estebike`      | `Estebike`               | `estebike` |
| `AGONISTI TEAM Estebike` | `AGONISTI TEAM` | `AGONISTI TEAM Estebike` | `agonisti` |

For each group:

1. **Switch chat.** Read `scripts/whatsapp-gallery/browser/switch-chat.mjs`, call `toScript({ groupName, query, headerMatch })`, pass the returned source to `evaluate_script`. Verify `{ ok: true, header: ... }`. Retry once on `header-mismatch`.
2. **Open media panel.** Read `browser/open-media-panel.mjs`, call `toScript()`, inject. Verify `{ ok: true, imageItems: > 0 }`.
3. **Scroll & download (looped).** Read `browser/scroll-and-download.mjs` (it also reads `browser/md5.mjs`). Call `toScript({ group, backfill })` — pass `backfill: true` only in backfill mode — and inject. Each call re-scrolls from the top, skips anything already in `window.__waDownloaded`, hashes the rest, and downloads up to `maxDownloads` (default 12) **new** images inline, returning `{ downloaded, scanned, errors, reachedCap, aborted, finalStreak, skippedKnown, downloadedHashes }`.

   **Loop the call** for the same group until it stops yielding work:
   - `reachedCap: true` → it hit the per-call download cap; **call again** (more remain).
   - `reachedCap: false` → it reached the panel bottom; the group is done.
   - `aborted: true` → a known-hash streak fired (default mode); the group is done.

   The 12-per-call cap keeps each `evaluate_script` well under its timeout while the inline throttle still dodges Chrome's rate limit. Track the last call's `aborted` / `finalStreak` and the running `downloaded` total per group for the report.

Saved files land in `~/Downloads/` as `wapull_{group}_{md5}_{slug}.jpg`. The naming is idempotent — re-running on the same image always produces the same filename, so any rate-limited Chrome retry overwrites the previous attempt cleanly.

### 4. Process and report

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

### 5. Report to the user

Take the CLI summary and add per-group context from the `aborted` and `finalStreak` fields of each group's final `scroll-and-download` call, e.g.:

> Estebike: 8 new (stopped after 15-known streak). AGONISTI TEAM: 0 new (panel exhausted). 56 known dupes skipped. Build OK.

## Behavior notes

- **Inline download (no dead blobs).** `scroll-and-download` fetches, hashes, and saves each new blob in the same injected call, so a blob URL never has to survive a round-trip to Node. This is the whole reason for the single-pass design — see "Why download inline" above.
- **Throttling.** It waits 1.2s between downloads and 2s every 5 to dodge Chrome's silent multi-download rate limit. Don't lower these without testing.
- **Per-call cap + loop.** Each call downloads at most `maxDownloads` (default 12) so a single `evaluate_script` stays under its timeout. Loop the call while `reachedCap` is true; stop on `reachedCap: false` (bottom) or `aborted: true` (known streak). `window.__waDownloaded` makes the re-scroll skip already-grabbed images.
- **Early stop.** Default abort threshold is 15 consecutive `window.__waKnown` hits. `__waKnown` holds only the **recent** slice of `known_hashes` (seeded by `make-init.mjs`) — enough because the panel is newest-first. With `--backfill` the streak rule is skipped (`backfill: true`).
- **Scroller is layout-independent.** `findScroller` looks for the tallest scrollable div inside `div[role="dialog"]`, so it works on narrow and wide windows alike (no viewport resize required).
- **Virtual scroll.** WhatsApp keeps ~95 image blobs hot at any time. The loop scrolls in 400px steps and retries a few times at the bottom to let WA stream older blobs; for older content use `--backfill`.
- **Deleted images.** Hashes stay in `known_hashes` even when files are deleted from the gallery — this is intentional: a deleted image is a rejected image.
- **Blob URL lifetime.** Blob URLs are valid only for the current WhatsApp Web session and only while their item is in the hot set. The whole flow must run end-to-end without navigating away.
- **Escape key.** Use the MCP `press_key` tool, not synthetic KeyboardEvents — WhatsApp Web ignores dispatched key events.
- **No viewer needed.** Media-panel thumbnails already carry the full-resolution blob URL; never click a thumbnail to "open" it.
- **Sequential numbering after rename.** Browser files use the hash; the processor renames to `estebike_NNN_slug.jpg` keyed on the highest existing index in the destination month. Both groups merge into a single sequence (matches the legacy convention).

## Backfill mode

Backfill is the same single-pass flow with two differences:

1. Pass `backfill: true` to `scroll-and-download`'s `toScript` so the consecutive-known-streak abort is skipped and every new hash gets downloaded.
2. Optionally pass `--month YYYY-MM` to `pull.mjs` to deposit into the historical folder.

WhatsApp will progressively fetch older blobs as you scroll, so backfill may take 5–10 minutes per group (many looped `scroll-and-download` calls).
