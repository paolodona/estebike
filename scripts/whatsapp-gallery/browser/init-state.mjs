/**
 * Seeds the shared run state used by scroll-and-download.mjs.
 *
 * Injected at the start of a pull, before the first group — and again if
 * WhatsApp Web reloads itself mid-run (it does this right after a device is
 * freshly linked, wiping every `window.__wa*` global). It sets two globals on
 * the WhatsApp Web tab:
 *   - window.__waKnown      Set of gallery hashes used for the known-streak
 *                           early-stop: the hashes of the images in the most
 *                           recent gallery month folders. The panel is
 *                           newest-first, so the streak we hit is always recent
 *                           gallery images. Keeping it small keeps the injected
 *                           source tiny.
 *   - window.__waDownloaded Set of hashes already downloaded this run. Seeded
 *                           from the `wapull_*` files still sitting in
 *                           ~/Downloads, so a re-init after a reload never
 *                           re-downloads what an earlier batch already saved.
 *
 * The authoritative dedup against the *full* known_hashes still happens in
 * process-downloads.mjs; __waKnown is only an optimization to stop scrolling
 * early and to avoid re-downloading already-imported images.
 *
 * Generate the ready-to-inject source with `make-scripts.mjs` rather than
 * hand-building the arrays.
 */
export function toScript({ knownHashes = [], downloadedHashes = [] }) {
  return `async () => {
  window.__waKnown = new Set(${JSON.stringify(knownHashes)});
  window.__waDownloaded = new Set(${JSON.stringify(downloadedHashes)});
  return { ok: true, known: window.__waKnown.size, downloaded: window.__waDownloaded.size };
}
`;
}
