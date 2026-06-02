#!/usr/bin/env node
/**
 * Post-pull orchestrator for /wa-gallery-pull.
 *
 * The browser side of the pull (scrolling the WhatsApp media panel and
 * downloading new blobs) runs inside the Chrome instance owned by the
 * Claude Code chrome-devtools MCP. That part is driven by the skill markdown.
 *
 * Once files have landed in ~/Downloads, this CLI runs the rest:
 *   1. process-downloads.mjs (hash dedup, rename, move, descriptions, state)
 *   2. Cleanup of any leftover wapull_* / estebike_* / agonisti_* files
 *      (e.g. a download that arrived after the processor batch).
 *   3. Emit a concise human-readable summary to stdout.
 *
 * Optionally also runs `npm run build` when --verify is passed.
 *
 * Usage:
 *   node scripts/whatsapp-gallery/pull.mjs            # process & report
 *   node scripts/whatsapp-gallery/pull.mjs --verify   # also runs astro build
 *   node scripts/whatsapp-gallery/pull.mjs --month 2026-04
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const SCRIPTS = path.join(ROOT, 'scripts/whatsapp-gallery');
const DL = path.join(os.homedir(), 'Downloads');

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  if (i === -1) return fallback;
  return process.argv[i + 1];
}
const verify = process.argv.includes('--verify');
const monthArg = arg('--month');

function runProcessor() {
  const args = [path.join(SCRIPTS, 'process-downloads.mjs')];
  if (monthArg) args.push('--month', monthArg);
  const r = spawnSync('node', args, { encoding: 'utf8' });
  if (r.status !== 0) {
    console.error('process-downloads failed:', r.stderr);
    process.exit(1);
  }
  return JSON.parse(r.stdout);
}

function cleanupLeftovers() {
  const stale = [];
  if (!fs.existsSync(DL)) return stale;
  for (const f of fs.readdirSync(DL)) {
    if (/^(wapull|estebike|agonisti)_/i.test(f)) {
      try {
        fs.unlinkSync(path.join(DL, f));
        stale.push(f);
      } catch {
        /* ignore */
      }
    }
  }
  return stale;
}

function readState() {
  const p = path.join(SCRIPTS, 'pull-state.json');
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null;
}

function runBuild() {
  const r = spawnSync('npx', ['astro', 'build'], {
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  return {
    ok: r.status === 0,
    tail: (r.stdout || '').split('\n').slice(-6).join('\n'),
  };
}

const result = runProcessor();
const stale = cleanupLeftovers();
const state = readState();
const build = verify ? runBuild() : null;

console.log('');
console.log('=== Pull summary ===');
console.log(`  Files seen:         ${result.seen}`);
console.log(
  `  New images:         ${result.moved}  (estebike: ${result.groupCounts.estebike}, agonisti: ${result.groupCounts.agonisti})`
);
console.log(`  Known duplicates:   ${result.skipped.knownDup}`);
console.log(`  Cross-group dupes:  ${result.skipped.crossDup}`);
console.log(`  Profanity censored: ${result.censored}`);
if (result.hashMismatchCount > 0) {
  console.log(
    `  ! Hash mismatches:  ${result.hashMismatchCount} (filename hash != bytes hash; check downloads)`
  );
}
if (stale.length > 0) {
  console.log(`  Leftovers cleaned:  ${stale.length}`);
}
if (state) {
  console.log(`  Gallery total:      ${state.total_downloaded}`);
  if (monthArg || result.month) {
    const m = monthArg || result.month;
    console.log(
      `  ${m} folder:        ${state.months_with_images?.[m] ?? '?'}`
    );
  }
}
if (result.sample.length > 0) {
  console.log('  Sample:');
  for (const s of result.sample) console.log(`    - ${s.to}  "${s.desc}"`);
}
if (build) {
  console.log('');
  console.log('=== Build ===');
  console.log(build.ok ? 'OK' : 'FAILED');
  console.log(build.tail);
}
