#!/usr/bin/env node
/**
 * Find near-duplicate images in public/images/gallery/ using a perceptual
 * hash (dHash) and emit a deletion list compatible with delete-selected.mjs.
 *
 * For each cluster of similar images, the highest-resolution file (ties broken
 * by larger file size, then lexicographic path) is kept; the rest go into the
 * deletion list.
 *
 * Usage:
 *   node scripts/whatsapp-gallery/find-duplicates.mjs [options]
 *
 * Options:
 *   --threshold <n>   Max Hamming distance to treat as duplicate (default: 5,
 *                     range 0-64; 0 = exact dHash match).
 *   --dir <path>      Gallery root to scan (default: public/images/gallery).
 *   --out <file>      Output list path (default: scripts/whatsapp-gallery/duplicates.txt).
 *   --review-html     Also write an HTML side-by-side review page next to --out.
 *   --include-exact   Skip perceptual phase, only group by SHA256 (fast).
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '../..');

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  if (i === -1) return fallback;
  const v = process.argv[i + 1];
  if (!v || v.startsWith('--')) return true;
  return v;
}

const THRESHOLD = Number(arg('--threshold', 5));
const DIR = path.resolve(ROOT, arg('--dir', 'public/images/gallery'));
const OUT = path.resolve(ROOT, arg('--out', 'scripts/whatsapp-gallery/duplicates.txt'));
const REVIEW_HTML = process.argv.includes('--review-html');
const EXACT_ONLY = process.argv.includes('--include-exact');

const IMG_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (IMG_EXT.has(path.extname(name).toLowerCase())) out.push(p);
  }
  return out;
}

// dHash: 9x8 grayscale, compare adjacent columns, 64-bit hash as BigInt.
async function dhash(file) {
  const buf = await sharp(file)
    .greyscale()
    .resize(9, 8, { fit: 'fill' })
    .raw()
    .toBuffer();
  let h = 0n;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const left = buf[row * 9 + col];
      const right = buf[row * 9 + col + 1];
      h = (h << 1n) | (left < right ? 1n : 0n);
    }
  }
  return h;
}

function hamming(a, b) {
  let x = a ^ b;
  let n = 0;
  while (x) {
    x &= x - 1n;
    n++;
  }
  return n;
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

const files = walk(DIR).sort();
console.log(`Scanning ${files.length} images in ${path.relative(ROOT, DIR)}…`);

const meta = []; // { file, hash (BigInt|null), sha, w, h, size }

let i = 0;
for (const file of files) {
  i++;
  if (i % 100 === 0) process.stderr.write(`  ${i}/${files.length}\r`);
  const st = fs.statSync(file);
  const sha = sha256(file);
  let info = { width: 0, height: 0 };
  try {
    info = await sharp(file).metadata();
  } catch (e) {
    console.warn(`  ! cannot read ${path.relative(ROOT, file)}: ${e.message}`);
    continue;
  }
  let h = null;
  if (!EXACT_ONLY) {
    try {
      h = await dhash(file);
    } catch (e) {
      console.warn(`  ! dhash failed ${path.relative(ROOT, file)}: ${e.message}`);
    }
  }
  meta.push({
    file,
    hash: h,
    sha,
    w: info.width || 0,
    h: info.height || 0,
    size: st.size,
  });
}
process.stderr.write(`  ${files.length}/${files.length}\n`);

// Cluster: union-find by (a) exact sha or (b) dHash within THRESHOLD.
const parent = meta.map((_, idx) => idx);
function find(x) {
  while (parent[x] !== x) {
    parent[x] = parent[parent[x]];
    x = parent[x];
  }
  return x;
}
function union(a, b) {
  const ra = find(a),
    rb = find(b);
  if (ra !== rb) parent[ra] = rb;
}

// Exact sha groups (cheap pass).
const bySha = new Map();
meta.forEach((m, idx) => {
  if (!bySha.has(m.sha)) bySha.set(m.sha, []);
  bySha.get(m.sha).push(idx);
});
for (const idxs of bySha.values()) {
  for (let k = 1; k < idxs.length; k++) union(idxs[0], idxs[k]);
}

// Perceptual pass: O(n^2) but n≈3k → ~4.5M comparisons of BigInt XOR, fine.
if (!EXACT_ONLY) {
  for (let a = 0; a < meta.length; a++) {
    if (meta[a].hash === null) continue;
    for (let b = a + 1; b < meta.length; b++) {
      if (meta[b].hash === null) continue;
      if (find(a) === find(b)) continue;
      if (hamming(meta[a].hash, meta[b].hash) <= THRESHOLD) union(a, b);
    }
  }
}

const groups = new Map();
meta.forEach((m, idx) => {
  const r = find(idx);
  if (!groups.has(r)) groups.set(r, []);
  groups.get(r).push(idx);
});

const dupGroups = [...groups.values()].filter((g) => g.length > 1);
const toDelete = [];
const groupsForReview = [];

for (const g of dupGroups) {
  // keeper: largest pixel area, then largest filesize, then lex path.
  const sorted = g
    .map((i) => meta[i])
    .sort((x, y) => {
      const ax = x.w * x.h,
        ay = y.w * y.h;
      if (ax !== ay) return ay - ax;
      if (x.size !== y.size) return y.size - x.size;
      return x.file.localeCompare(y.file);
    });
  const [keep, ...drop] = sorted;
  groupsForReview.push({ keep, drop });
  for (const d of drop) toDelete.push(path.relative(ROOT, d.file).replace(/\\/g, '/'));
}

fs.writeFileSync(OUT, toDelete.join('\n') + (toDelete.length ? '\n' : ''));
console.log(
  `\nFound ${dupGroups.length} duplicate group(s), ${toDelete.length} file(s) to delete.`
);
console.log(`List → ${path.relative(ROOT, OUT)}`);

if (REVIEW_HTML) {
  const htmlPath = OUT.replace(/\.txt$/, '') + '.html';
  const rel = (f) => 'file:///' + f.replace(/\\/g, '/');
  const rows = groupsForReview
    .map(({ keep, drop }) => {
      const cell = (m, label) => `
        <figure class="${label}">
          <img src="${rel(m.file)}" loading="lazy" />
          <figcaption>
            <strong>${label}</strong>
            <code>${path.relative(ROOT, m.file).replace(/\\/g, '/')}</code>
            <span>${m.w}×${m.h} • ${(m.size / 1024).toFixed(0)} KB</span>
          </figcaption>
        </figure>`;
      return `<section class="group">${cell(keep, 'KEEP')}${drop
        .map((d) => cell(d, 'DROP'))
        .join('')}</section>`;
    })
    .join('\n');
  const html = `<!doctype html><meta charset="utf-8"><title>Duplicate review</title>
<style>
  body { font: 14px system-ui; margin: 16px; background: #111; color: #eee; }
  .group { display: flex; gap: 12px; padding: 12px; border-bottom: 1px solid #333; flex-wrap: wrap; }
  figure { margin: 0; max-width: 280px; }
  img { width: 100%; height: auto; display: block; border: 3px solid transparent; }
  .KEEP img { border-color: #2bbf6a; }
  .DROP img { border-color: #cc2635; }
  figcaption { font-size: 12px; padding: 4px 0; }
  figcaption code { display: block; word-break: break-all; color: #aaa; }
  figcaption strong { color: inherit; }
  .KEEP strong { color: #2bbf6a; }
  .DROP strong { color: #cc2635; }
</style>
<h1>Duplicate review — ${dupGroups.length} groups, ${toDelete.length} drops</h1>
<p>Threshold: dHash Hamming ≤ ${THRESHOLD}. Edit <code>${path.relative(ROOT, OUT).replace(/\\/g, '/')}</code> to remove any line you want to keep, then run <code>node scripts/whatsapp-gallery/delete-selected.mjs ${path.relative(ROOT, OUT).replace(/\\/g, '/')} --dry-run</code>.</p>
${rows}`;
  fs.writeFileSync(htmlPath, html);
  console.log(`Review → ${path.relative(ROOT, htmlPath)}`);
}
