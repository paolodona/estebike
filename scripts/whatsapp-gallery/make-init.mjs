#!/usr/bin/env node
/**
 * Generates the init-state injection source for /wa-gallery-pull.
 *
 * Reads the most recent `--recent N` (default 800) hashes from
 * pull-state.json#known_hashes and writes a ready-to-inject evaluate_script
 * body to `--out <path>` (default: stdout). The orchestrator injects this once,
 * before the first group, so scroll-and-download.mjs can do its known-streak
 * early-stop without inlining the full ~3,800-entry hash list into every batch.
 *
 * Usage:
 *   node scripts/whatsapp-gallery/make-init.mjs --out /tmp/init-state.js
 *   node scripts/whatsapp-gallery/make-init.mjs --recent 1200 --out init.js
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { toScript } from './browser/init-state.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const STATE_PATH = path.join(HERE, 'pull-state.json');

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i === -1 ? fallback : process.argv[i + 1];
}

const recent = parseInt(arg('--recent', '800'), 10);
const out = arg('--out');

const state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
const all = Array.isArray(state.known_hashes) ? state.known_hashes : [];
const slice = all.slice(-recent);
const src = toScript({ knownHashes: slice });

if (out) {
  fs.writeFileSync(out, src);
  console.error(
    `Wrote init-state injection (${slice.length} of ${all.length} known hashes) to ${out}`
  );
} else {
  process.stdout.write(src);
}
