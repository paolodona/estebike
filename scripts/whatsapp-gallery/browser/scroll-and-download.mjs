/**
 * Combined scroll + hash + INLINE download for the WhatsApp media panel.
 *
 * This replaces the old two-pass design (scroll-and-hash.mjs → Node filter →
 * download-list.mjs). That design captured blob URLs in pass 1 and re-fetched
 * them in pass 2, but WhatsApp Web revokes a blob URL once its media item
 * scrolls out of the hot set (or after a short idle), so by the time the Node
 * round-trip finished the captured URLs were dead ("Failed to fetch"). The
 * panel also ends pass 1 scrolled to the bottom, so the newest items (which we
 * want most) are the first to be revoked.
 *
 * The fix: download each new blob *immediately* while it is still hot, in the
 * same injected script that hashes it. No blob URL ever has to survive a
 * round-trip to Node.
 *
 * Dedup + early-stop state lives on `window` (set once by init-state.mjs) so it
 * survives across the multiple injected calls the orchestrator makes to stay
 * under the evaluate_script timeout:
 *   - window.__waKnown      Set of gallery hashes (recent slice of known_hashes)
 *   - window.__waDownloaded Set of hashes downloaded so far this run
 *
 * Because download is throttled (Chrome silently rate-limits multi-downloads),
 * a full panel can take longer than one evaluate_script call allows. The caller
 * therefore invokes this repeatedly with a `maxDownloads` cap: each call
 * re-scrolls from the top, skips anything already in __waDownloaded, and grabs
 * the next batch of new images. Loop while `reachedCap` is true; stop when a
 * call returns `reachedCap: false` (panel bottom reached) or `aborted: true`
 * (default-mode known-streak hit).
 *
 * Returns:
 *   {
 *     ok: true,
 *     scanned,            // unique blobs hashed this call
 *     downloaded,         // new images downloaded this call
 *     errors,             // fetch/hash/download failures this call
 *     skippedKnown,       // hits against window.__waKnown
 *     skippedRun,         // hits against window.__waDownloaded (prior batches)
 *     reachedCap,         // true if we stopped because downloaded === maxDownloads
 *     aborted,            // true if a known-streak triggered an early stop
 *     finalStreak,        // length of the trailing consecutive-known streak
 *     scrollHeight,       // for diagnostics
 *     downloadedHashes,   // hashes downloaded this call
 *   }
 */
import { MD5_SOURCE } from './md5.mjs';

export function toScript({
  group, // 'estebike' | 'agonisti' — used in the saved filename
  maxDownloads = 12, // cap per call so a single evaluate_script stays well under timeout
  abortStreak = 15, // consecutive known-hash hits that ends a default-mode pull
  backfill = false, // when true, never abort on a known streak
  scrollStepPx = 400,
  scrollWaitMs = 500,
  bottomStall = 6, // extra scroll attempts at the bottom to let WA load older blobs
  throttleMs = 1200,
  burstPauseMs = 2000,
} = {}) {
  const cfg = JSON.stringify({
    group,
    maxDownloads,
    abortStreak,
    backfill,
    scrollStepPx,
    scrollWaitMs,
    bottomStall,
    throttleMs,
    burstPauseMs,
  });
  return `
(async () => {
  ${MD5_SOURCE}
  const cfg = ${cfg};
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // Shared run state (set by init-state.mjs). Default to empty sets so the
  // script still runs if init was skipped (the Node processor dedups anyway).
  const known = window.__waKnown instanceof Set ? window.__waKnown : new Set();
  if (!(window.__waDownloaded instanceof Set)) window.__waDownloaded = new Set();
  const done = window.__waDownloaded;

  function senderFromLabel(label) {
    const m = (label || '').match(/from\\s+(.+?)$/);
    const raw = m ? m[1] : 'unknown';
    const s = raw.replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/\\s+/g, '_').substring(0, 30);
    return s || 'unknown';
  }

  // Layout-independent: find the tallest scrollable div inside the media dialog.
  // (The old version required left > 1000, which broke on narrow windows.)
  function findScroller() {
    const dialog = document.querySelector('div[role="dialog"]');
    const root = dialog || document.body;
    let best = null;
    for (const d of root.querySelectorAll('div')) {
      if (d.scrollHeight > d.clientHeight + 200 && d.clientHeight > 200) {
        if (!best || d.scrollHeight > best.scrollHeight) best = d;
      }
    }
    return best;
  }

  function captureNew(seenBlobs) {
    const dialog = document.querySelector('div[role="dialog"]');
    if (!dialog) return [];
    const out = [];
    for (const li of dialog.querySelectorAll('[role="listitem"]')) {
      const label = li.getAttribute('aria-label') || '';
      if (!label.includes('Image')) continue;
      let blob = null;
      for (const dv of li.querySelectorAll('div')) {
        const bg = getComputedStyle(dv).backgroundImage;
        const m = bg && bg.match(/url\\("(blob:[^"]+)"\\)/);
        if (m) { blob = m[1]; break; }
      }
      if (blob && !seenBlobs.has(blob)) out.push({ blob, label: label.substring(0, 120) });
    }
    return out;
  }

  async function downloadBlob(blobUrl, hash, label) {
    const resp = await fetch(blobUrl);
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wapull_' + cfg.group + '_' + hash + '_' + senderFromLabel(label) + '.jpg';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const scroller = findScroller();
  if (!scroller) return { ok: false, error: 'no-scroller' };
  scroller.scrollTop = 0;
  await sleep(700);

  const seenBlobs = new Set();   // blob URLs visited this call
  const seenHashes = new Set();  // hashes hashed this call (avoid double work)
  const downloadedHashes = [];
  let errors = 0, scanned = 0, skippedKnown = 0, skippedRun = 0;
  let reachedCap = false, aborted = false, streak = 0;

  // Process one freshly-captured slice. Returns true to stop scrolling.
  async function processCaptured(captured) {
    for (const { blob, label } of captured) {
      seenBlobs.add(blob);
      let hash;
      try {
        const resp = await fetch(blob);
        const buf = await resp.arrayBuffer();
        hash = __md5(new Uint8Array(buf));
      } catch (e) { errors++; continue; }
      if (seenHashes.has(hash)) continue;
      seenHashes.add(hash);
      scanned++;

      if (done.has(hash)) { skippedRun++; continue; } // grabbed in a prior batch — neutral
      if (known.has(hash)) {
        skippedKnown++;
        streak++;
        if (!cfg.backfill && streak >= cfg.abortStreak) { aborted = true; return true; }
        continue;
      }
      // New image — download it now, while the blob URL is still valid.
      try {
        await downloadBlob(blob, hash, label);
        done.add(hash);
        downloadedHashes.push(hash);
        streak = 0;
        await sleep(cfg.throttleMs);
        if (downloadedHashes.length % 5 === 0) await sleep(cfg.burstPauseMs);
      } catch (e) { errors++; }
      if (downloadedHashes.length >= cfg.maxDownloads) { reachedCap = true; return true; }
    }
    return false;
  }

  let stop = await processCaptured(captureNew(seenBlobs));
  let pos = 0, stall = 0;
  while (!stop && stall < cfg.bottomStall) {
    pos += cfg.scrollStepPx;
    scroller.scrollTop = pos;
    await sleep(cfg.scrollWaitMs);
    const before = scanned;
    stop = await processCaptured(captureNew(seenBlobs));
    if (pos + scroller.clientHeight >= scroller.scrollHeight) {
      // At the bottom: WA may still stream older blobs, so retry a few times.
      if (scanned === before) stall++; else stall = 0;
    } else {
      stall = 0;
    }
  }

  return {
    ok: true,
    scanned,
    downloaded: downloadedHashes.length,
    errors,
    skippedKnown,
    skippedRun,
    reachedCap,
    aborted,
    finalStreak: streak,
    scrollHeight: scroller.scrollHeight,
    downloadedHashes,
  };
})()
`;
}
