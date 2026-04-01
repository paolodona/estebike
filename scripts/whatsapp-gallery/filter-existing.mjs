#!/usr/bin/env node
/**
 * Apply meme/graphic filters to existing gallery images.
 * Deletes junk images and preserves their hashes in pull-state.json.
 */

import sharp from "sharp";
import { imageSize } from "image-size";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const ROOT = path.resolve(import.meta.dirname, "../..");
const GALLERY_DIR = path.join(ROOT, "public/images/gallery");
const STATE_PATH = path.join(ROOT, "scripts/whatsapp-gallery/pull-state.json");

async function scoreImage(filepath) {
  const buf = fs.readFileSync(filepath);
  const fileSize = buf.length;
  let dims;
  try {
    dims = imageSize(buf);
  } catch {
    return { score: 0, reasons: [], hash: null };
  }
  const { width, height } = dims;
  if (!width || !height) return { score: 0, reasons: [], hash: null };

  const ratio = Math.max(width, height) / Math.min(width, height);
  const pixels = width * height;
  const bpp = fileSize / pixels;

  let score = 0;
  const reasons = [];

  if (fileSize < 15000) { score += 5; reasons.push("tiny_file"); }
  if (ratio > 3.0) { score += 5; reasons.push("elongated"); }

  const { data } = await sharp(filepath)
    .resize(64, 64, { fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const px = 64 * 64;
  let nrW = 0, nrB = 0, satSum = 0;
  const col3 = new Set();
  for (let i = 0; i < px; i++) {
    const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
    if (r > 220 && g > 220 && b > 220) nrW++;
    if (r < 35 && g < 35 && b < 35) nrB++;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    satSum += mx > 0 ? (mx - mn) / mx : 0;
    col3.add(((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5));
  }
  const nrWPct = (nrW / px) * 100;
  const nrBPct = (nrB / px) * 100;
  const sat = satSum / px;
  const colors = col3.size;

  if (colors < 50 && sat < 0.16) { score += 4; reasons.push("low_color_desat"); }
  if (nrWPct + nrBPct > 55) { score += 4; reasons.push("extreme_bw"); }
  if (nrWPct > 40 && sat < 0.20) { score += 4; reasons.push("white_bg_desat"); }
  if (bpp < 0.06) { score += 4; reasons.push("over_compressed"); }
  if (colors < 80 && bpp < 0.12) { score += 4; reasons.push("low_color_low_bpp"); }

  const hash = "\\" + crypto.createHash("md5").update(buf).digest("hex");
  return { score, reasons, hash };
}

async function main() {
  const state = JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
  const knownHashes = new Set(state.known_hashes);
  const toDelete = [];

  const years = fs.readdirSync(GALLERY_DIR).filter((d) =>
    fs.statSync(path.join(GALLERY_DIR, d)).isDirectory()
  );

  for (const year of years) {
    const yearDir = path.join(GALLERY_DIR, year);
    const months = fs.readdirSync(yearDir).filter((d) =>
      fs.statSync(path.join(yearDir, d)).isDirectory()
    );
    for (const month of months) {
      const monthDir = path.join(yearDir, month);
      const files = fs.readdirSync(monthDir).filter((f) => f.endsWith(".jpg"));
      for (const f of files) {
        const fp = path.join(monthDir, f);
        const result = await scoreImage(fp);
        if (result.score >= 4) {
          toDelete.push({
            path: fp,
            relPath: `${year}/${month}/${f}`,
            score: result.score,
            reasons: result.reasons,
            hash: result.hash,
          });
        }
      }
    }
  }

  console.log(`Images to delete: ${toDelete.length}`);
  for (const d of toDelete.slice(0, 40)) {
    console.log(`  ${d.relPath} score=${d.score} [${d.reasons.join(",")}]`);
  }
  if (toDelete.length > 40) console.log(`  ... and ${toDelete.length - 40} more`);

  let deleted = 0;
  for (const d of toDelete) {
    knownHashes.add(d.hash);
    fs.unlinkSync(d.path);
    deleted++;
  }

  state.known_hashes = [...knownHashes].sort();
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
  console.log(`\nDeleted ${deleted} images. Hashes preserved in pull-state.json.`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
