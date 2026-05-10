/**
 * Pass 1 of the pull: scroll the WhatsApp media panel, fetch each blob,
 * and return its MD5 hash + label. No downloads happen here.
 *
 * The caller (Node side) then filters the returned list against
 * `pull-state.json#known_hashes` and decides which to download in Pass 2.
 *
 * This avoids inlining thousands of known hashes into the browser script
 * (which made the injected source ~140KB and clumsy to ship via MCP).
 *
 * Returns:
 *   {
 *     ok: true,
 *     scanned: number,        // unique blobs visited
 *     errors: number,
 *     items: [{ blobUrl, hash, label }],   // sorted newest-first
 *   }
 */
import { MD5_SOURCE } from './md5.mjs';

export function toScript({
  scrollStepPx = 400,
  scrollWaitMs = 450,
  maxItems = 500,
} = {}) {
  const cfg = JSON.stringify({ scrollStepPx, scrollWaitMs, maxItems });
  return `
(async () => {
  ${MD5_SOURCE}
  const cfg = ${cfg};
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  function findScroller() {
    const all = document.querySelectorAll('div');
    let best = null;
    for (const d of all) {
      if (d.scrollHeight > d.clientHeight + 200 && d.clientHeight > 200) {
        const r = d.getBoundingClientRect();
        if (r.left > 1000 && r.width > 400) {
          if (!best || d.scrollHeight > best.scrollHeight) best = d;
        }
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
      for (const d of li.querySelectorAll('div')) {
        const bg = getComputedStyle(d).backgroundImage;
        const m = bg && bg.match(/url\\("(blob:[^"]+)"\\)/);
        if (m) { blob = m[1]; break; }
      }
      if (blob && !seenBlobs.has(blob)) {
        out.push({ blob, label: label.substring(0, 120) });
      }
    }
    return out;
  }

  const scroller = findScroller();
  if (!scroller) return { ok: false, error: 'no-scroller' };

  scroller.scrollTop = 0;
  await sleep(700);

  const seen = new Set();
  const items = [];
  let errors = 0;

  async function processCaptured(captured) {
    for (const { blob, label } of captured) {
      if (items.length >= cfg.maxItems) break;
      seen.add(blob);
      try {
        const resp = await fetch(blob);
        const buf = await resp.arrayBuffer();
        const hash = __md5(new Uint8Array(buf));
        items.push({ blobUrl: blob, hash, label });
      } catch (e) {
        errors++;
      }
    }
  }

  // Initial viewport
  await processCaptured(captureNew(seen));

  // Scroll and drain
  let pos = 0;
  const total = scroller.scrollHeight;
  while (pos + scroller.clientHeight < total && items.length < cfg.maxItems) {
    pos += cfg.scrollStepPx;
    scroller.scrollTop = pos;
    await sleep(cfg.scrollWaitMs);
    await processCaptured(captureNew(seen));
  }

  return { ok: true, scanned: items.length, errors, items };
})()
`;
}
