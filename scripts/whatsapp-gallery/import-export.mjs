#!/usr/bin/env node
/**
 * Import images from a WhatsApp "Export Chat" zip into the gallery.
 *
 * Usage:
 *   node scripts/whatsapp-gallery/import-export.mjs <path-to-zip> [--dry-run]
 *
 * What it does:
 *   1. Extracts zip to a temp dir (handles multi-GB zips)
 *   2. Parses chat text to map images → sender + caption + date
 *   3. Scores each image for "non-photo" likelihood (screenshots, documents, leaflets)
 *   4. Deduplicates against known_hashes in pull-state.json
 *   5. Copies qualifying images to public/images/gallery/YYYY/MM/
 *   6. Updates pull-state.json and descriptions.json
 *
 * Filtering: each image gets a "non-photo score" (0-10) based on:
 *   - Caption keywords (Strava links, weather forecasts)
 *   - File size too small (stickers/icons)
 *   - Extreme aspect ratios (stitched screenshots)
 *   - Pixel analysis: navigation bars, white backgrounds, Strava map patterns
 *   Images scoring >= 4 are filtered out.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { execSync } from "child_process";
import sharp from "sharp";

import { imageSize } from "image-size";

const ROOT = path.resolve(import.meta.dirname, "../..");
const GALLERY_DIR = path.join(ROOT, "public/images/gallery");
const STATE_PATH = path.join(ROOT, "scripts/whatsapp-gallery/pull-state.json");
const DESC_PATH = path.join(ROOT, "scripts/whatsapp-gallery/descriptions.json");

const DRY_RUN = process.argv.includes("--dry-run");
const LIMIT_IDX = process.argv.findIndex((a) => a === "--limit");
const LIMIT = LIMIT_IDX >= 0 ? parseInt(process.argv[LIMIT_IDX + 1], 10) : Infinity;
const ZIP_PATH = process.argv[2];

if (!ZIP_PATH || ZIP_PATH.startsWith("--")) {
  console.error("Usage: node import-export.mjs <path-to-zip> [--dry-run] [--limit N]");
  process.exit(1);
}

// ─── Parse the chat text ─────────────────────────────────────────────────────

function parseChatText(text) {
  const imageMap = new Map();
  const lines = text.split("\n");
  const msgRegex = /^(\d{2}\/\d{2}\/\d{4}), (\d{2}:\d{2}) - ([^:]+): (.*)/;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(msgRegex);
    if (!match) continue;

    const [, dateStr, , sender, content] = match;
    const fileMatch = content.match(
      /(IMG-\d{8}-WA\d+\.jpg)\s*\(file attached\)/i
    );
    if (!fileMatch) continue;

    const filename = fileMatch[1];
    let caption = content.replace(fileMatch[0], "").trim();
    for (let j = i + 1; j < lines.length; j++) {
      if (msgRegex.test(lines[j])) break;
      const cont = lines[j].trim();
      if (cont) caption = caption ? `${caption} ${cont}` : cont;
    }

    const [dd, mm, yyyy] = dateStr.split("/");
    imageMap.set(filename, {
      sender: sender.trim(),
      caption: caption || null,
      year: yyyy,
      month: mm,
      date: `${yyyy}-${mm}-${dd}`,
    });
  }

  return imageMap;
}

// ─── Non-photo scoring ───────────────────────────────────────────────────────

async function scoreNonPhoto(filepath, filename, caption) {
  const buf = fs.readFileSync(filepath);
  const fileSize = buf.length;
  let dims;
  try {
    dims = imageSize(buf);
  } catch {
    return { score: 0, reasons: [] };
  }

  const { width, height } = dims;
  if (!width || !height) return { score: 0, reasons: [] };

  const ratio = Math.max(width, height) / Math.min(width, height);
  const portrait = height > width;
  const cap = (caption || "").toLowerCase();

  let score = 0;
  const reasons = [];

  // ── Caption signals (highest confidence) ──
  if (
    /strava\.app\.link|strava\.com|attivit[àa]\s+su\s+strava|pedalata\s+su\s+strava/i.test(
      cap
    )
  ) {
    score += 5;
    reasons.push("strava_link");
  }
  if (
    /previsioni|meteo\b|allerta\s+meteo/i.test(cap) &&
    !/bel\s+tempo|brutto\s+tempo/i.test(cap)
  ) {
    score += 4;
    reasons.push("weather_caption");
  }

  // ── Size/ratio signals ──
  if (fileSize < 15_000) {
    score += 5;
    reasons.push("tiny_file");
  }
  if (ratio > 3.0) {
    score += 5;
    reasons.push("elongated");
  }

  // ── Thumbnail pixel analysis (all images) ──
  // Single thumbnail pass to compute color/saturation/white/black metrics
  const { data: thumbData } = await sharp(filepath)
    .resize(64, 64, { fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const px = 64 * 64;
  const pixels = width * height;
  const bpp = fileSize / pixels;
  let nearWhiteP = 0, nearBlackP = 0, satSum = 0;
  let colorSet3 = new Set(); // 3-bit per channel (512 max)
  let colorSet4 = new Set(); // 4-bit per channel (4096 max)
  let rS = 0, gS = 0, bS = 0, rQ = 0, gQ = 0, bQ = 0;

  for (let i = 0; i < px; i++) {
    const r = thumbData[i * 3],
      g = thumbData[i * 3 + 1],
      b = thumbData[i * 3 + 2];
    if (r > 220 && g > 220 && b > 220) nearWhiteP++;
    if (r < 35 && g < 35 && b < 35) nearBlackP++;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    satSum += mx > 0 ? (mx - mn) / mx : 0;
    colorSet3.add(((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5));
    colorSet4.add(((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4));
    rS += r; gS += g; bS += b;
    rQ += r * r; gQ += g * g; bQ += b * b;
  }

  const nrWhitePct = (nearWhiteP / px) * 100;
  const nrBlackPct = (nearBlackP / px) * 100;
  const sat = satSum / px;
  const col3 = colorSet3.size;
  const bright = (rS + gS + bS) / px / 3;
  const totalVar =
    rQ / px - (rS / px) ** 2 +
    (gQ / px - (gS / px) ** 2) +
    (bQ / px - (bS / px) ** 2);

  // ── Meme/graphic detection (applied to ALL images) ──
  // Calibrated against 20 user-flagged junk images and 6 verified good photos.
  // Good photos: col3 >= 86, sat >= 0.204, bpp >= 0.088

  // Low color + low saturation → B&W memes, product photos, documents
  if (col3 < 50 && sat < 0.16) {
    score += 4;
    reasons.push("low_color_desat");
  }

  // Extreme B&W → text memes, cartoons, infographics
  if (nrWhitePct + nrBlackPct > 55) {
    score += 4;
    reasons.push("extreme_bw");
  }

  // White background + desaturated → greeting cards, text memes
  if (nrWhitePct > 40 && sat < 0.20) {
    score += 4;
    reasons.push("white_bg_desat");
  }

  // Very low bytes-per-pixel → text/graphics compress far better than photos
  if (bpp < 0.06) {
    score += 4;
    reasons.push("over_compressed");
  }

  // Low color + low bpp → forwarded graphics, flyers, memes
  if (col3 < 80 && bpp < 0.12) {
    score += 4;
    reasons.push("low_color_low_bpp");
  }

  // ── Portrait screenshot detection ──
  if (portrait && ratio > 1.7 && width >= 400) {
    // Bottom strip analysis (navigation bar detection)
    const botH = Math.max(1, Math.round(height * 0.03));
    const botStart = height - botH;

    const { data: botData } = await sharp(filepath)
      .extract({ left: 0, top: botStart, width, height: botH })
      .resize(64, 3, { fit: "fill" })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const botPx = 64 * 3;
    let bRs2 = 0, bGs2 = 0, bBs2 = 0, bRq2 = 0, bGq2 = 0, bBq2 = 0, bBright2 = 0;
    for (let i = 0; i < botPx; i++) {
      const r = botData[i * 3], g = botData[i * 3 + 1], b = botData[i * 3 + 2];
      bRs2 += r; bGs2 += g; bBs2 += b;
      bRq2 += r * r; bGq2 += g * g; bBq2 += b * b;
      if (r > 230 && g > 230 && b > 230) bBright2++;
    }
    const botVar =
      bRq2 / botPx - (bRs2 / botPx) ** 2 +
      (bGq2 / botPx - (bGs2 / botPx) ** 2) +
      (bBq2 / botPx - (bBs2 / botPx) ** 2);
    const botBrightPct = bBright2 / botPx;

    // Navigation bar: very uniform bottom strip, usually light colored
    if (botVar < 80 && botBrightPct > 0.7) {
      score += 4;
      reasons.push("nav_bar");
    }

    // Very high white background → document/web page
    if (nrWhitePct > 50) {
      score += 4;
      reasons.push("white_document");
    }
    // White background + nav bar combo
    else if (nrWhitePct > 35 && botVar < 200) {
      score += 4;
      reasons.push("white_bg_nav");
    }
  }

  // ── Square Strava-like maps ──
  if (Math.abs(ratio - 1.0) < 0.05 && width >= 1000) {
    if (totalVar < 3000 && bright > 170 && colorSet4.size < 130) {
      score += 4;
      reasons.push("strava_map");
    }
  }

  return { score, reasons };
}

function censorProfanity(text) {
  const words = [
    "cazzo", "minchia", "merda", "stronzo", "stronza", "vaffanculo",
    "coglione", "fuck", "shit", "damn", "bitch",
  ];
  const expletives = ["porca", "porco", "madonna", "dio"];
  let result = text;
  for (const w of words) {
    result = result.replace(new RegExp(w, "gi"), "***");
  }
  for (const w of expletives) {
    result = result.replace(
      new RegExp(`(^|\\s)${w}(?=\\s|$|!)`, "gi"),
      "$1***"
    );
  }
  return result;
}

// ─── Main ────────────────────────────────────────────────────────────────────

const FILTER_THRESHOLD = 4;

async function main() {
  // Step 1: Extract zip
  const tmpDir = path.join(ROOT, "scripts/whatsapp-gallery/.tmp-import");
  if (fs.existsSync(tmpDir)) {
    console.log("Cleaning previous temp dir...");
    fs.rmSync(tmpDir, { recursive: true });
  }
  fs.mkdirSync(tmpDir, { recursive: true });

  console.log("Extracting zip (this may take a while for large files)...");
  try {
    execSync(`unzip -o -q "${ZIP_PATH}" -d "${tmpDir}"`, {
      stdio: "inherit",
      timeout: 600_000,
    });
  } catch {
    console.error("Failed to extract zip.");
    process.exit(1);
  }

  // Step 2: Parse chat text
  const txtFiles = fs.readdirSync(tmpDir).filter((f) => f.endsWith(".txt"));
  if (txtFiles.length === 0) {
    console.error("No chat text file found!");
    process.exit(1);
  }
  const chatText = fs.readFileSync(path.join(tmpDir, txtFiles[0]), "utf8");
  const imageMap = parseChatText(chatText);
  console.log(`Chat text parsed: ${imageMap.size} image references`);

  // Step 3: Find all JPGs
  const allFiles = fs
    .readdirSync(tmpDir)
    .filter((f) => /^IMG-.*\.jpg$/i.test(f))
    .sort(); // chronological order by filename
  console.log(`JPG files: ${allFiles.length}`);

  // Load state
  const state = JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
  const knownHashes = new Set(state.known_hashes || []);
  let descriptions = {};
  try {
    descriptions = JSON.parse(fs.readFileSync(DESC_PATH, "utf8"));
  } catch {
    /* empty */
  }

  const stats = {
    total: allFiles.length,
    filtered: 0,
    duplicate: 0,
    imported: 0,
    by_month: {},
    filter_reasons: {},
  };
  const imported = [];
  const filtered = [];
  const monthIndexOffset = {};

  for (let fi = 0; fi < allFiles.length; fi++) {
    if (stats.imported >= LIMIT) break;

    const filename = allFiles[fi];
    const filePath = path.join(tmpDir, filename);

    if (fi % 500 === 0 && fi > 0) {
      console.log(`  Processing ${fi}/${allFiles.length}...`);
    }

    // Quick size check
    const fileSize = fs.statSync(filePath).size;
    if (fileSize < 5_000) {
      stats.filtered++;
      stats.filter_reasons["tiny_file"] =
        (stats.filter_reasons["tiny_file"] || 0) + 1;
      continue;
    }

    // MD5 dedup
    const buf = fs.readFileSync(filePath);
    const hash = "\\" + crypto.createHash("md5").update(buf).digest("hex");
    if (knownHashes.has(hash)) {
      stats.duplicate++;
      continue;
    }

    // Get metadata
    const meta = imageMap.get(filename);
    let year, month, sender, caption;

    if (meta) {
      ({ year, month, sender, caption } = meta);
    } else {
      const dateMatch = filename.match(/IMG-(\d{4})(\d{2})(\d{2})/);
      if (dateMatch) {
        year = dateMatch[1];
        month = dateMatch[2];
      } else {
        continue;
      }
      sender = "unknown";
      caption = null;
    }

    // Score for non-photo content
    const { score, reasons } = await scoreNonPhoto(
      filePath,
      filename,
      caption
    );
    if (score >= FILTER_THRESHOLD) {
      stats.filtered++;
      for (const r of reasons) {
        stats.filter_reasons[r] = (stats.filter_reasons[r] || 0) + 1;
      }
      filtered.push({
        f: filename,
        score,
        reasons,
        sender: meta?.sender,
        caption: caption?.substring(0, 40),
      });
      continue;
    }

    // Import the image
    const monthKey = `${year}-${month}`;
    const monthDir = path.join(GALLERY_DIR, year, month);

    if (!(monthKey in monthIndexOffset)) {
      let existing = 0;
      try {
        existing = fs
          .readdirSync(monthDir)
          .filter((f) => f.endsWith(".jpg")).length;
      } catch {
        /* dir doesn't exist */
      }
      monthIndexOffset[monthKey] = existing;
    }

    monthIndexOffset[monthKey]++;
    const idx = String(monthIndexOffset[monthKey]).padStart(3, "0");

    const cleanSender = (sender || "unknown")
      .replace(/[^a-zA-Z0-9\u00C0-\u024F ]/g, "")
      .trim()
      .replace(/\s+/g, "_")
      .substring(0, 20);

    const outFilename = `estebike_${idx}_${cleanSender}.jpg`;
    const outPath = path.join(monthDir, outFilename);

    if (!DRY_RUN) {
      fs.mkdirSync(monthDir, { recursive: true });
      fs.copyFileSync(filePath, outPath);
    }

    knownHashes.add(hash);

    // Description
    let desc;
    if (caption) {
      desc = caption.substring(0, 80);
    } else if (sender && sender !== "unknown") {
      desc = `${sender} - uscita in bici`;
    } else {
      desc = "Foto dal gruppo EsteBike";
    }
    desc = censorProfanity(desc);
    descriptions[outFilename] = desc;

    stats.by_month[monthKey] = (stats.by_month[monthKey] || 0) + 1;
    stats.imported++;

    imported.push({
      original: filename,
      output: `${year}/${month}/${outFilename}`,
      sender,
      caption: caption ? caption.substring(0, 50) : null,
    });
  }

  // Update state
  if (!DRY_RUN) {
    state.known_hashes = [...knownHashes].sort();
    state.total_downloaded = (state.total_downloaded || 0) + stats.imported;
    state.last_pull = new Date().toISOString();
    for (const [mk, count] of Object.entries(stats.by_month)) {
      state.months_with_images[mk] =
        (state.months_with_images[mk] || 0) + count;
    }
    fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));

    const comment = descriptions._comment;
    delete descriptions._comment;
    const sorted = {
      _comment: comment || "Maps image filename to Italian alt text.",
      ...descriptions,
    };
    fs.writeFileSync(DESC_PATH, JSON.stringify(sorted, null, 2));
  }

  // Clean up
  console.log("Cleaning up temp dir...");
  fs.rmSync(tmpDir, { recursive: true, force: true });

  // Report
  console.log("\n══════════════════════════════════");
  console.log("  WhatsApp Export Import Report");
  console.log("══════════════════════════════════");
  console.log(`Total images in zip:     ${stats.total}`);
  console.log(`Filtered (non-photo):    ${stats.filtered}`);
  console.log(`Duplicates (known hash): ${stats.duplicate}`);
  console.log(`IMPORTED:                ${stats.imported}`);

  console.log(`\nFilter breakdown:`);
  for (const [reason, count] of Object.entries(stats.filter_reasons).sort(
    (a, b) => b[1] - a[1]
  )) {
    console.log(`  ${reason}: ${count}`);
  }

  console.log(`\nBy month:`);
  for (const [m, count] of Object.entries(stats.by_month).sort()) {
    console.log(`  ${m}: ${count} images`);
  }

  if (DRY_RUN) {
    console.log("\n!! DRY RUN — no files were written.");
  }

  if (imported.length > 0) {
    console.log(`\nFirst 10 imported:`);
    for (const img of imported.slice(0, 10)) {
      console.log(
        `  ${img.original} -> ${img.output} (${img.sender}${img.caption ? `: ${img.caption}` : ""})`
      );
    }
    if (imported.length > 10) {
      console.log(`  ... and ${imported.length - 10} more`);
    }
  }

  if (filtered.length > 0) {
    console.log(`\nSample filtered:`);
    for (const f of filtered.slice(0, 10)) {
      console.log(
        `  ${f.f} score=${f.score} [${f.reasons.join(",")}]${f.caption ? ` "${f.caption}"` : ""}`
      );
    }
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
