#!/usr/bin/env node
/**
 * Writes every evaluate_script injection for /wa-gallery-pull into one folder.
 *
 * Each file holds a function declaration, ready to pass verbatim as the
 * `function` argument of chrome-devtools `evaluate_script`:
 *
 *   init.js                 seeds window.__waKnown / window.__waDownloaded
 *   switch-estebike.js      switches to the Estebike group
 *   switch-agonisti.js      switches to AGONISTI TEAM Estebike
 *   open-media-panel.js     opens "Media, links and docs", dismisses popovers
 *   sd-estebike.js          scroll-and-download for Estebike
 *   sd-agonisti.js          scroll-and-download for AGONISTI TEAM
 *
 * Known hashes (for the early-stop) are the MD5s of the images in the most
 * recent `--months N` (default 3) gallery month folders — NOT a tail slice of
 * pull-state.json#known_hashes, because delete-selected / filter-existing /
 * import-export re-sort that array alphabetically, so its tail is not "recent".
 *
 * Downloaded hashes are read from the wapull_* files already in ~/Downloads,
 * so re-running this after WhatsApp Web reloads mid-pull (which wipes the tab's
 * globals) re-seeds the run state without re-downloading saved images.
 *
 * Usage:
 *   node scripts/whatsapp-gallery/make-scripts.mjs --out-dir <dir> [--backfill] [--months 3]
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { toScript as initScript } from './browser/init-state.mjs';
import { toScript as switchScript } from './browser/switch-chat.mjs';
import { toScript as openScript } from './browser/open-media-panel.mjs';
import { toScript as sdScript } from './browser/scroll-and-download.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GALLERY = path.join(HERE, '../../public/images/gallery');
const DL = path.join(os.homedir(), 'Downloads');

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i === -1 ? fallback : process.argv[i + 1];
}

const outDir = arg('--out-dir');
if (!outDir) {
  console.error(
    'Usage: make-scripts.mjs --out-dir <dir> [--backfill] [--months N]'
  );
  process.exit(1);
}
const months = parseInt(arg('--months', '3'), 10);
const backfill = process.argv.includes('--backfill');

// Month folders are YYYY/MM or YYYY/MM-event; group by YYYY-MM, newest first.
function recentMonthDirs() {
  const byMonth = new Map();
  for (const y of fs.readdirSync(GALLERY)) {
    if (!/^\d{4}$/.test(y)) continue;
    for (const m of fs.readdirSync(path.join(GALLERY, y))) {
      const mm = m.match(/^(\d{2})/);
      if (!mm) continue;
      const key = `${y}-${mm[1]}`;
      if (!byMonth.has(key)) byMonth.set(key, []);
      byMonth.get(key).push(path.join(GALLERY, y, m));
    }
  }
  const keys = [...byMonth.keys()].sort().reverse().slice(0, months);
  return { keys, dirs: keys.flatMap((k) => byMonth.get(k)) };
}

const md5 = (file) =>
  crypto.createHash('md5').update(fs.readFileSync(file)).digest('hex');

const { keys, dirs } = recentMonthDirs();
const known = new Set();
for (const dir of dirs) {
  for (const f of fs.readdirSync(dir)) {
    if (/\.(jpe?g|png|webp)$/i.test(f)) known.add(md5(path.join(dir, f)));
  }
}

const downloaded = fs.existsSync(DL)
  ? fs
      .readdirSync(DL)
      .map((f) => f.match(/^wapull_[a-z]+_([0-9a-f]{32})_/))
      .filter(Boolean)
      .map((m) => m[1])
  : [];

fs.mkdirSync(outDir, { recursive: true });
const files = {
  'init.js': initScript({
    knownHashes: [...known],
    downloadedHashes: downloaded,
  }),
  'switch-estebike.js': switchScript({
    groupName: 'Estebike',
    query: 'Estebike',
    headerMatch: 'Estebike',
  }),
  'switch-agonisti.js': switchScript({
    groupName: 'AGONISTI TEAM Estebike',
    query: 'AGONISTI TEAM',
    headerMatch: 'AGONISTI TEAM Estebike',
  }),
  'open-media-panel.js': openScript(),
  'sd-estebike.js': sdScript({ group: 'estebike', backfill }),
  'sd-agonisti.js': sdScript({ group: 'agonisti', backfill }),
};
for (const [name, src] of Object.entries(files)) {
  fs.writeFileSync(path.join(outDir, name), src);
}

console.error(
  `Wrote ${Object.keys(files).length} scripts to ${outDir} ` +
    `(known: ${known.size} hashes from ${keys.join(', ')}; ` +
    `already downloaded: ${downloaded.length}; backfill: ${backfill})`
);
