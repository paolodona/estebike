# Original Prompt: Blog Migration Script
Plan: 002 | Name: blog-migration | Created: 2026-01-25 | GitRef: 0238b1e

## Related Files
- **Context**: `.agent_session/002_blog-migration_context.md` - Research findings
- **Plan**: `.agent_session/002_blog-migration_plan.md` - Implementation steps

---

## Original User Request

> to create a migration script that migrates all old blog posts and images to the new site
> ensure images are re-scaled and ready for a modern website (for example do we need mobile friendly versions? maybe not)

---

## Refined Prompt

Create a migration script to extract blog posts and images from the crawled legacy site, convert them to Astro-compatible content, and optimize images for modern web delivery.

**Architectural Mandate**:
The migration script should be a standalone Node.js utility in a `/scripts` or `/tools` directory. It MUST output content in the exact format specified in SPECS.md and DESIGN.md - blog posts as Markdown files in `/src/content/blog/` with filename format `YYYY-MM-DD-slug.md`, and images in `/public/images/blog/`. Image processing logic should be modular to allow reuse for other content migrations (gallery, sponsors).

**Pre-Implementation Analysis Required**:
1. **Analyze crawled-site structure**: Examine `/crawled-site/` to understand the HTML structure of existing blog posts, how dates are encoded, and where images are stored/referenced.
2. **Identify content patterns**: Determine how post metadata (title, date, author, categories) is embedded in the legacy HTML.
3. **Catalog image inventory**: Analyze existing images - file formats, dimensions, file sizes. Identify which are oversized and need rescaling.
4. **Research Astro image handling**: Investigate Astro's `<Image>` component and `astro:assets` - does Astro handle responsive images automatically at build time? If so, the migration may only need to provide reasonably-sized source images (e.g., max 1600-2000px width) and let Astro generate variants.
5. **Determine image strategy**: Based on research, decide:
   - Target dimensions for migrated images (e.g., max 1600px width for hero/full-width, 800px for inline)
   - Whether to pre-generate multiple sizes or rely on Astro's built-in optimization
   - Output format (keep original, convert to WebP, or let Astro handle)
6. **Review Astro content schema**: Check if there's an existing content collection schema defined for blog posts that the migration must conform to.

**Scope**:
- IN: HTML-to-Markdown conversion for blog posts, frontmatter generation (title, date, slug, description), image extraction, image rescaling to web-appropriate dimensions, path rewriting in content.
- OUT: Manual content editing/cleanup, SEO redirects from old URLs, gallery/sponsor image migration (separate script if needed).

**Image Processing Requirements**:
- Rescale oversized images to sensible maximum dimensions (investigate optimal sizes during analysis)
- Maintain aspect ratios
- Use modern format if beneficial (WebP) or defer to Astro's optimization
- Preserve originals in a separate archive folder for reference
- Log any images that fail processing or have issues

**Success Criteria**:
- **Automated**:
  - Script runs without errors on the full crawled-site dataset.
  - All generated Markdown files have valid frontmatter with required fields.
  - All image references in Markdown point to existing, optimized files.
  - No images exceed target maximum dimensions.
  - Total image payload is significantly reduced from original crawled content.
- **Manual**:
  1. Run the migration script.
  2. Start Astro dev server - no build errors.
  3. Verify 3-5 sample blog posts render correctly with images.
  4. Confirm images display crisp on both mobile and desktop viewports.
  5. Check network tab - image file sizes are reasonable (<500KB for large images, <100KB for thumbnails).
  6. Confirm dates are correctly parsed and filenames follow `YYYY-MM-DD-slug.md` format.

**Context References**:
- `docs/SPECS.md` - Blog content structure and filename conventions
- `docs/DESIGN.md` - Typography and image styling requirements
- `crawled-site/` - Source content for migration

**Backlog**: Any discovered issues like broken images, malformed HTML, images requiring manual attention, or content cleanup tasks should be logged to `.agent_session/BACKLOG.md` for post-migration review.
