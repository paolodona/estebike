---
name: wa-gallery-dedupe
description: Find and remove visually duplicate gallery images using a perceptual hash. Generates a review HTML, asks for confirmation, then deletes (preserving hashes in pull-state.json so the duplicates won't be re-imported).
---

# WhatsApp Gallery Dedupe

Scan `public/images/gallery/` for near-duplicate images using the perceptual-hash script (`scripts/whatsapp-gallery/find-duplicates.mjs`), let the user review the proposed deletions, then apply them with `scripts/whatsapp-gallery/delete-selected.mjs`. Deleted files have their MD5 hashes added to `pull-state.json` `known_hashes` so they won't be re-imported by `/wa-gallery-pull`.

**Arguments:** `$ARGUMENTS`

- No args = scan entire gallery with default threshold (Hamming distance 5).
- `--threshold <n>` = override perceptual similarity threshold (0 = exact match only, higher = more aggressive).
- `--month YYYY-MM` = restrict scan to a single month folder.
- `--exact` = use SHA256 only (skip perceptual phase, fast).
- `--auto` = skip the review step and delete immediately (use with care).

## Steps

### 1. Run the duplicate finder

Translate `--month YYYY-MM` (if provided) into a `--dir` argument pointing at the month folder. Default output goes to `scripts/whatsapp-gallery/duplicates.txt` plus an HTML review page next to it.

```bash
# Whole gallery
node scripts/whatsapp-gallery/find-duplicates.mjs --review-html

# Single month
node scripts/whatsapp-gallery/find-duplicates.mjs --review-html \
  --dir public/images/gallery/2026/05 \
  --out scripts/whatsapp-gallery/duplicates-202605.txt

# Tighter threshold
node scripts/whatsapp-gallery/find-duplicates.mjs --review-html --threshold 3

# Exact match only (fast)
node scripts/whatsapp-gallery/find-duplicates.mjs --include-exact --review-html
```

The script keeps the highest-resolution file in each cluster (ties broken by file size, then path) and writes the rest to the deletion list.

### 2. Report and confirm

Read the deletion list (`scripts/whatsapp-gallery/duplicates.txt` or the `--out` path) and report:

- Total clusters found
- Total files proposed for deletion
- A short preview of the first 10 entries (one path per line)
- Path to the HTML review page (`duplicates.html`) so the user can open it and uncheck false positives

Unless `--auto` was passed, **stop and ask the user** to confirm before deleting. The user can:

- Approve as-is → proceed to step 3 with the original list.
- Edit the list (remove paths to keep) → proceed to step 3 with the edited list.
- Cancel → abort.

### 3. Apply deletions

```bash
# Dry run first (recommended when threshold > 0)
node scripts/whatsapp-gallery/delete-selected.mjs scripts/whatsapp-gallery/duplicates.txt --dry-run

# Apply
node scripts/whatsapp-gallery/delete-selected.mjs scripts/whatsapp-gallery/duplicates.txt
```

This script:

- Hashes each file before deleting.
- Adds new hashes to `pull-state.json` `known_hashes` (so `/wa-gallery-pull` won't re-import them).
- Removes the corresponding entry from `descriptions.json`.
- Deletes the file from disk.

### 4. Verify

```bash
npx astro build 2>&1 | tail -5
```

Report to the user:

- Number of files deleted (and not-found / already-hashed counts from the script output)
- Whether the build still passes
- Updated total gallery count (read from `pull-state.json`)

## Notes

- **Hashes are sticky.** Once a file's MD5 lands in `known_hashes`, it can never be re-imported. This is intentional — it lets the user prune the gallery without `/wa-gallery-pull` undoing the work.
- **The HTML review is the single source of truth for false positives.** The perceptual hash treats burst-shot variations (slightly different angles of the same scene) as duplicates. Use the review page to keep the ones that are actually distinct.
- **Threshold tuning:** start at the default (5). Drop to 3 if you're getting false positives; raise to 8–10 if visually identical images are being missed (e.g., re-encodes from different devices).
- **Subset scans:** prefer `--month` or a custom `--dir` when you've just imported a batch — far faster than re-hashing the whole gallery.
