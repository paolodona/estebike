# Implementation Plan: Blog Migration Script

Plan: 002 | Name: blog-migration | Created: 2026-01-25 | Status: IMPLEMENTED | GitRef: 0238b1e

## Related Files

- **Prompt**: `.agent_session/002_blog-migration_prompt.md` - Original mission/task
- **Context**: `.agent_session/002_blog-migration_context.md` - Research findings

---

## Overview

Create a Node.js migration script to convert 74 legacy WordPress blog posts from the crawled site into Astro-compatible Markdown files with optimized images.

## Affected Areas

| Area                    | Affected | Scope                          |
| ----------------------- | -------- | ------------------------------ |
| `scripts/migrate-blog/` | Yes      | New migration script (6 files) |
| `src/content/blog/`     | Yes      | Output: 74 Markdown files      |
| `public/images/blog/`   | Yes      | Output: ~250 optimized images  |
| `src/content/config.ts` | No       | Existing schema (unchanged)    |

## What We're NOT Doing

- Manual content editing/cleanup
- SEO redirects from old URLs
- Gallery/sponsor image migration (separate scripts)

## Architecture Decision: Image Location

**Chosen**: `/public/images/blog/` (static folder)
**Rationale**: Simpler path rewriting, no imports in Markdown, standard image syntax

---

## Phase 1: Project Setup & Dependencies

**Goal**: Initialize the migration script

**Files**:

- `scripts/migrate-blog/index.ts` - Main entry point
- `scripts/migrate-blog/parsers.ts` - HTML parsing
- `scripts/migrate-blog/images.ts` - Image processing
- `scripts/migrate-blog/types.ts` - TypeScript interfaces
- `scripts/migrate-blog/config.ts` - Configuration
- `scripts/migrate-blog/package.json` - Dependencies

**Dependencies**: cheerio, turndown, sharp, glob, sanitize-filename

**Success Criteria**: npm install completes, TypeScript compiles

---

## Phase 2: HTML Parser Module

**Goal**: Extract metadata from legacy HTML

**Extraction**:
| Field | Selector |
|-------|----------|
| title | `h1.entry-title` |
| date | `meta[itemprop="datePublished"]` |
| category | `meta[property="article:section"]` |
| tags | `meta[property="article:tag"]` |
| content | `.entry-content` innerHTML |

**Category Mapping**: news→News, comunicato→Comunicato del direttivo, coppa→Coppa Colli Euganei, convenzioni→Convenzioni (default: News)

**Success Criteria**: Sample post parsed correctly

---

## Phase 3: Image Processing Module

**Goal**: Copy, resize, optimize images

**Rules**:

- Max width: 1600px (maintain aspect ratio)
- Keep original format (JPG/PNG)
- Output: `/public/images/blog/{year}/{month}/{filename}`
- Skip WordPress thumbnail variants (regex: `-\d+x\d+\.[a-z]+$`)

**Path Rewrite**:

```
../wp-content/uploads/2015/06/image.jpg
→ /images/blog/2015/06/image.jpg
```

**Success Criteria**: Oversized images resized, small ones copied unchanged

---

## Phase 4: HTML to Markdown Conversion

**Goal**: Convert content to clean Markdown using Turndown

**Custom Rules**:

- Rewrite image paths
- Remove WordPress shortcodes
- Strip srcset attributes

**Success Criteria**: Clean Markdown, no HTML artifacts

---

## Phase 5: Markdown File Generation

**Goal**: Generate Astro content files

**Output Format**:

```markdown
---
title: 'Post Title'
date: 2015-06-12
author: 'admin'
category: 'News'
tags: ['tag1', 'tag2']
image: '/images/blog/2015/06/image.jpg'
---

Content...
```

**Filename**: `YYYY-MM-DD-slug.md`

- **Slug source**: Extract from legacy directory name (e.g., `atestina-superbike-2015/` → `atestina-superbike-2015`)
- **Location**: `src/content/blog/`

**Featured Image Logic** (for `image` frontmatter):

1. `meta[property="og:image"]` (primary)
2. First `<img>` in `.entry-content` (fallback)
3. `null` if no images found

**Success Criteria**: 74 valid Markdown files

---

## Phase 6: Main Script & CLI

**Goal**: Orchestrate migration with reporting

**CLI**:

```bash
npx tsx scripts/migrate-blog/index.ts [--dry-run] [--slug <name>]
```

**Output**: Migration report with success/failure counts

---

## Verification

### Automated

```bash
cd scripts/migrate-blog && npm install
npx tsx index.ts
cd ../.. && npm run build
```

### Manual

1. Check 74 .md files in `src/content/blog/`
2. Check images in `public/images/blog/`
3. Visit /blog - posts render
4. Verify random posts - images display
5. Test oldest (2013) and newest (2018) posts
