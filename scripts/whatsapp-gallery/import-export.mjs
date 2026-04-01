#!/usr/bin/env node
/**
 * Import images from a WhatsApp "Export Chat" zip into the gallery.
 *
 * Usage:
 *   node scripts/whatsapp-gallery/import-export.mjs <path-to-zip> [--dry-run]
 *
 * Handles large (multi-GB) zips by extracting to a temp dir first via system unzip,
 * then processing files from disk one at a time.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { execSync } from "child_process";
import imageSize from "image-size";

const ROOT = path.resolve(import.meta.dirname, "../..");
const GALLERY_DIR = path.join(ROOT, "public/images/gallery");
const STATE_PATH = path.join(ROOT, "scripts/whatsapp-gallery/pull-state.json");
const DESC_PATH = path.join(ROOT, "scripts/whatsapp-gallery/descriptions.json");

const DRY_RUN = process.argv.includes("--dry-run");
const ZIP_PATH = process.argv[2];

if (!ZIP_PATH || ZIP_PATH.startsWith("--")) {
  console.error("Usage: node import-export.mjs <path-to-zip> [--dry-run]");
  process.exit(1);
}

// ─── Heuristics for filtering out non-photo images ───────────────────────────

function classifyImage(filePath) {
  const fileSize = fs.statSync(filePath).size;

  // Too small → sticker, icon, or tiny meme
  if (fileSize < 15_000) return "too_small";

  let dims;
  try {
    dims = imageSize(filePath);
  } catch {
    return null; // can't read dims, keep it
  }

  const { width, height } = dims;
  if (!width || !height) return null;

  // Very small images (thumbnails, stickers)
  if (width < 200 && height < 200) return "tiny";

  const ratio = Math.max(width, height) / Math.min(width, height);

  // Extremely elongated → stitched screenshot or document scan
  if (ratio > 3.0) return "elongated";

  // Portrait with phone-screenshot-like dimensions
  const screenshotWidths = [720, 1080, 1170, 1242, 1284, 1290, 1440];
  if (
    height > width &&
    ratio > 1.8 &&
    screenshotWidths.some((sw) => Math.abs(width - sw) < 10)
  ) {
    return "screenshot";
  }

  // Very low bytes/pixel → compressed graphic/flyer, not a photo
  const pixels = width * height;
  const bytesPerPixel = fileSize / pixels;
  if (pixels > 500_000 && bytesPerPixel < 0.04) return "graphic";

  return null; // looks like a real photo
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
    const fileMatch = content.match(/(IMG-\d{8}-WA\d+\.jpg)\s*\(file attached\)/i);
    if (!fileMatch) continue;

    const filename = fileMatch[1];

    // Caption: text after "(file attached)" on same line, plus continuation lines
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

async function main() {
  // Step 1: Extract zip to temp dir using system unzip
  const tmpDir = path.join(ROOT, "scripts/whatsapp-gallery/.tmp-import");
  if (fs.existsSync(tmpDir)) {
    console.log("Cleaning previous temp dir...");
    fs.rmSync(tmpDir, { recursive: true });
  }
  fs.mkdirSync(tmpDir, { recursive: true });

  console.log(`Extracting zip to temp dir (this may take a while for large zips)...`);
  try {
    execSync(`unzip -o -q "${ZIP_PATH}" -d "${tmpDir}"`, {
      stdio: "inherit",
      timeout: 600_000, // 10 min max
    });
  } catch (err) {
    console.error("Failed to extract zip. Make sure 'unzip' is available.");
    process.exit(1);
  }

  // Step 2: Parse chat text
  const txtFiles = fs.readdirSync(tmpDir).filter((f) => f.endsWith(".txt"));
  if (txtFiles.length === 0) {
    console.error("No chat text file found in zip!");
    process.exit(1);
  }
  const chatText = fs.readFileSync(path.join(tmpDir, txtFiles[0]), "utf8");
  const imageMap = parseChatText(chatText);
  console.log(`Chat text parsed: ${imageMap.size} image references found`);

  // Step 3: Find all JPG files in temp dir
  const allFiles = fs.readdirSync(tmpDir).filter((f) => /^IMG-.*\.jpg$/i.test(f));
  console.log(`JPG files extracted: ${allFiles.length}`);

  // Load state + descriptions
  const state = JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
  const knownHashes = new Set(state.known_hashes || []);
  let descriptions = {};
  try {
    descriptions = JSON.parse(fs.readFileSync(DESC_PATH, "utf8"));
  } catch { /* empty */ }

  const stats = {
    total: allFiles.length,
    filtered_too_small: 0,
    filtered_tiny: 0,
    filtered_elongated: 0,
    filtered_screenshot: 0,
    filtered_graphic: 0,
    duplicate: 0,
    imported: 0,
    by_month: {},
  };
  const imported = [];

  // Track per-month index offsets for this run
  const monthIndexOffset = {};

  for (let fi = 0; fi < allFiles.length; fi++) {
    const filename = allFiles[fi];
    const filePath = path.join(tmpDir, filename);

    if (fi % 500 === 0 && fi > 0) {
      console.log(`  Processing ${fi}/${allFiles.length}...`);
    }

    // Filter non-photos
    const filterReason = classifyImage(filePath);
    if (filterReason) {
      stats[`filtered_${filterReason}`]++;
      continue;
    }

    // Compute MD5 hash
    const buf = fs.readFileSync(filePath);
    const hash = "\\" + crypto.createHash("md5").update(buf).digest("hex");

    if (knownHashes.has(hash)) {
      stats.duplicate++;
      continue;
    }

    // Get metadata from chat text, fall back to filename date
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

    const monthKey = `${year}-${month}`;
    const monthDir = path.join(GALLERY_DIR, year, month);

    // Count existing files once per month, then track offset
    if (!(monthKey in monthIndexOffset)) {
      let existing = 0;
      try {
        existing = fs.readdirSync(monthDir).filter((f) => f.endsWith(".jpg")).length;
      } catch { /* dir doesn't exist yet */ }
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
      state.months_with_images[mk] = (state.months_with_images[mk] || 0) + count;
    }
    fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));

    // Update descriptions
    const comment = descriptions._comment;
    delete descriptions._comment;
    const sorted = { _comment: comment || "Maps image filename to Italian alt text.", ...descriptions };
    fs.writeFileSync(DESC_PATH, JSON.stringify(sorted, null, 2));
  }

  // Clean up temp dir
  console.log("Cleaning up temp dir...");
  fs.rmSync(tmpDir, { recursive: true, force: true });

  // Report
  console.log("\n═══ Import Report ═══");
  console.log(`Total images in zip:     ${stats.total}`);
  console.log(`Filtered (too small):    ${stats.filtered_too_small}`);
  console.log(`Filtered (tiny):         ${stats.filtered_tiny}`);
  console.log(`Filtered (elongated):    ${stats.filtered_elongated}`);
  console.log(`Filtered (screenshot):   ${stats.filtered_screenshot}`);
  console.log(`Filtered (graphic):      ${stats.filtered_graphic}`);
  console.log(`Duplicates (known hash): ${stats.duplicate}`);
  console.log(`IMPORTED:                ${stats.imported}`);
  console.log(`\nBy month:`);
  for (const [m, count] of Object.entries(stats.by_month).sort()) {
    console.log(`  ${m}: ${count} images`);
  }

  if (DRY_RUN) {
    console.log("\n⚠ DRY RUN — no files were written.");
  }

  if (imported.length > 0) {
    console.log(`\nFirst 10 imported:`);
    for (const img of imported.slice(0, 10)) {
      console.log(`  ${img.original} → ${img.output} (${img.sender}${img.caption ? `: ${img.caption}` : ""})`);
    }
    if (imported.length > 10) {
      console.log(`  ... and ${imported.length - 10} more`);
    }
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
