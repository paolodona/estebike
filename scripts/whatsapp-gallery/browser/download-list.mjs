/**
 * Pass 2 of the pull: download a pre-filtered list of new images.
 *
 * The caller has already hashed every visible blob (via scroll-and-hash.mjs)
 * and filtered out anything in `known_hashes`. We just need to fetch each
 * blob URL again and trigger a save with the right filename.
 *
 * Throttled to dodge Chrome's silent multi-download rate limit.
 *
 * Returns:
 *   {
 *     ok: true,
 *     downloaded: number,
 *     errors: number,
 *     attempted: number,
 *   }
 */
export function toScript({
  group, // 'estebike' | 'agonisti' — used in the saved filename
  toDownload, // [{ blobUrl, hash, label }]
  throttleMs = 1200,
  burstPauseMs = 2000,
}) {
  const cfg = JSON.stringify({ group, throttleMs, burstPauseMs });
  const list = JSON.stringify(toDownload);
  return `
(async () => {
  const cfg = ${cfg};
  const list = ${list};
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  function senderFromLabel(label) {
    const m = (label || '').match(/from\\s+(.+?)$/);
    const raw = m ? m[1] : 'unknown';
    const s = raw.replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/\\s+/g, '_').substring(0, 30);
    return s || 'unknown';
  }

  let downloaded = 0, errors = 0;
  for (let i = 0; i < list.length; i++) {
    const { blobUrl, hash, label } = list[i];
    const slug = senderFromLabel(label);
    const filename = 'wapull_' + cfg.group + '_' + hash + '_' + slug + '.jpg';
    try {
      const resp = await fetch(blobUrl);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.style.display = 'none';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      downloaded++;
    } catch (e) {
      errors++;
    }
    await sleep(cfg.throttleMs);
    if (downloaded > 0 && downloaded % 5 === 0) await sleep(cfg.burstPauseMs);
  }
  return { ok: true, attempted: list.length, downloaded, errors };
})()
`;
}
