/**
 * Seeds the shared run state used by scroll-and-download.mjs.
 *
 * Injected ONCE at the start of a pull, before the first group. It sets two
 * globals on the WhatsApp Web tab:
 *   - window.__waKnown      Set of gallery hashes used for the known-streak
 *                           early-stop. The caller passes a *recent slice* of
 *                           `pull-state.json#known_hashes` (newest entries),
 *                           not the full ~3,800 — the panel is newest-first, so
 *                           the streak we hit is always recent gallery images.
 *                           Keeping it small keeps the injected source tiny.
 *   - window.__waDownloaded Empty Set, accumulates hashes downloaded this run
 *                           so re-scrolls across batched calls (and the second
 *                           group) never re-download the same image.
 *
 * The authoritative dedup against the *full* known_hashes still happens in
 * process-downloads.mjs; __waKnown is only an optimization to stop scrolling
 * early and to avoid re-downloading already-imported images.
 *
 * Generate the ready-to-inject source with `make-init.mjs` (it reads the recent
 * slice from pull-state.json for you) rather than hand-building the array.
 */
export function toScript({ knownHashes = [] }) {
  return `
(() => {
  window.__waKnown = new Set(${JSON.stringify(knownHashes)});
  window.__waDownloaded = new Set();
  return { ok: true, known: window.__waKnown.size, downloaded: 0 };
})()
`;
}
