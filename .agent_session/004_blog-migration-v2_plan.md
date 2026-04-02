# Implementation Plan: Blog Migration Script (v2)
Plan: 004 | Name: blog-migration-v2 | Created: 2026-04-02 | Status: PLANNED | GitRef: 985cde6

## Related Files
- **Prompt**: `.agent_session/004_blog-migration-v2_prompt.md` - Original mission/task
- **Context**: `.agent_session/004_blog-migration-v2_context.md` - Research findings and decisions

---

## Overview

The blog migration (Plan 002) was already implemented and is working correctly. Blog posts use `/images/blog/` paths exclusively — gallery images can be safely deleted without affecting any blog post. This plan addresses the minor gaps discovered during the audit.

## Current State → Desired End State

**Current**: 67 migrated blog posts, 91 blog images, clean separation from gallery. 1 missing image, no skip logic for re-runs.

**Desired**: Fix the missing image, add idempotent skip logic with `--force` flag, confirm the 6 unmigrated items are intentionally excluded (pages, not posts).

## What We're NOT Doing
- Gallery curation or image removal (user handles this separately)
- Astro component changes
- Blog list/index page changes
- Re-running the full migration (already done)

---

## Phase 1: Fix Missing Image

**Goal**: Resolve the 1 broken image reference

**Changes**:
- Locate `partenza_b.jpg` in `crawled-site/www.estebike.it/wp-content/uploads/2014/06/` and copy to `public/images/blog/2014/06/partenza_b.jpg`
- If not found in crawled-site, check if the blog post referencing it should have the image removed

**Success Criteria**:
- All image references in `src/content/blog/*.md` resolve to existing files in `public/images/blog/`

## Phase 2: Add Idempotent Skip Logic

**Goal**: Make the script safe to re-run without overwriting manually-edited posts

**Changes**:
- `scripts/migrate-blog/index.ts`: Before writing each .md file, check if it already exists. Skip with a log message unless `--force` is passed.
- Add `--force` flag parsing alongside existing `--dry-run` and `--slug` flags

**Success Criteria**:
- `node scripts/migrate-blog/index.ts --dry-run` shows existing posts as "SKIP (exists)"
- `node scripts/migrate-blog/index.ts --force` overwrites existing posts
- Default run (no flags) skips existing posts

## Phase 3: Verify 6 Unmigrated Items

**Goal**: Confirm the 6 unmigrated crawled items are pages (not blog posts) and should remain excluded

**Items**: convenzioni-team-estebike, informativa-sui-cookies, link-utili, squadra-corse-ciclismo-e-mtb, team-estebike-zordan, vestiario-estebike

**Changes**:
- Read each HTML file and verify they lack `single-post` body class
- If any are actual blog posts, migrate them
- If they're pages, no action needed (script already filters them correctly)

**Success Criteria**:
- All 6 items confirmed as pages or migrated if they're posts

---

## Verification

### Automated
```bash
# Verify no blog .md references gallery paths
grep -r "images/gallery" src/content/blog/ # should return nothing

# Verify all referenced images exist
# (script's --dry-run should report this)
npx tsx scripts/migrate-blog/index.ts --dry-run
```

### Manual
1. Confirm `partenza_b.jpg` exists or reference is cleaned up
2. Run migration script twice — second run should skip all posts
3. Spot-check 3-4 blog posts with images — images load correctly
