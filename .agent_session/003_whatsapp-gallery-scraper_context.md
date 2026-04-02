# Session Context: WhatsApp Gallery Scraper

Plan: 003 | Name: whatsapp-gallery-scraper | Updated: 2026-01-25 | GitRef: 0238b1e

## Related Files

- **Prompt**: `.agent_session/003_whatsapp-gallery-scraper_prompt.md` - Original mission
- **Plan**: `.agent_session/003_whatsapp-gallery-scraper_plan.md` - Implementation steps

---

## Task Summary

- **Requirement**: Extract images from WhatsApp Web via Chrome DevTools MCP, download locally, and catalog with AI-generated metadata for website curation
- **Scope**: WhatsApp image scraping, downloading, AI analysis, catalog generation
- **Out of Scope**: WhatsApp authentication, website gallery implementation, video extraction, privacy/consent management

## Key Discoveries

### Gallery Requirements (from SPECS.md and DESIGN.md)

- `docs/SPECS.md:147-158` - Gallery specs: grid layout, lightbox, organized by event/year, lazy loading
- `docs/DESIGN.md:438-445` - Gallery design: masonry/uniform grid, 3 cols desktop, 2 tablet, 1 mobile
- `docs/DESIGN.md:570-583` - Image specs: 1200px max width, WebP with JPG fallback, 80% compression

### Existing Scripts

- `/scripts/crawl-site.sh`, `.py`, `.ps1` - Existing crawl scripts for the legacy site
- No existing image processing utilities found

### Chrome DevTools MCP Capabilities (Verified)

Available tools confirmed working:

- `mcp__chrome-devtools__list_pages` - List open browser pages
- `mcp__chrome-devtools__take_snapshot` - Get a11y tree snapshot to find image elements
- `mcp__chrome-devtools__take_screenshot` - Capture screenshots of elements or full page
- `mcp__chrome-devtools__click` - Click elements (to open image viewer)
- `mcp__chrome-devtools__press_key` - Navigate with keyboard (PageUp for scrolling)
- `mcp__chrome-devtools__evaluate_script` - Run JavaScript to extract image URLs/data
- `mcp__chrome-devtools__hover` - Hover over elements
- `mcp__chrome-devtools__navigate_page` - Navigate to URLs

### WhatsApp Web Structure (Expected)

- Images in chat appear as thumbnail elements with `data-testid="image-thumb"`
- Clicking opens full-resolution in overlay/viewer with `data-testid="media-viewer"`
- Full-res images available as blob URLs
- Chat history loads lazily on scroll (PageUp key)

## Design Decisions

| Decision                | Choice                      | Rationale                                                                    |
| ----------------------- | --------------------------- | ---------------------------------------------------------------------------- |
| Implementation approach | Interactive Claude workflow | WhatsApp's dynamic UI is better handled adaptively than with brittle scripts |
| Image extraction        | JavaScript blob fetch       | More reliable than screenshots, gets original resolution                     |
| Catalog format          | JSON                        | Easy to parse, portable, can add fields later                                |
| Deduplication           | SHA256 hash                 | Content-based, catches duplicates even with different names                  |
| AI analysis             | Claude vision via Read tool | Same model, consistent analysis, no external API needed                      |

## Open Questions

- None remaining - all questions resolved through research

## Assumptions

- WhatsApp Web uses `data-testid` attributes for image elements (may need adjustment)
- Blob URLs are accessible via fetch within the page context
- User will manually authenticate and navigate to the correct group

---

## External Review: Gemini + Claude Analysis

**Date**: 2026-01-25

### Gemini's Feedback

**Strengths identified:**

1. Pragmatic interactive workflow over brittle automation
2. Comprehensive catalog schema with AI analysis and curation fields
3. Robust extraction via blob fetch + SHA256 deduplication

**Concerns raised:**

1. High-risk dependency on unstable `data-testid` selectors
2. Gap between downloaded images and website-ready format (WebP, 1200px)
3. Scalability of PageUp scrolling for large chat histories
4. Error-prone manual JSON curation

**Suggestions:**

1. Abstract selectors into configuration file
2. Add image processing phase for WebP conversion
3. Generate HTML curation tool instead of manual JSON editing

**Questions:**

1. Session resumption strategy after interruption?
2. Rate limiting / anti-automation risk?
3. CSP blocking blob URL fetching?

### Claude's Assessment

| Suggestion             | Verdict     | Rationale                                                                                  |
| ---------------------- | ----------- | ------------------------------------------------------------------------------------------ |
| Selector config file   | ❌ Declined | Interactive workflow is inherently adaptive; Claude inspects actual DOM via snapshots      |
| Image processing phase | ⚠️ Partial  | Clarified in backlog: process AFTER curation to avoid wasting effort on rejected images    |
| HTML curation tool     | ✅ Accepted | Moved from backlog to Phase 5; prevents JSON syntax errors, dramatically improves UX       |
| Session resumption     | ⚠️ Partial  | Added note: hash-based deduplication handles resumption automatically                      |
| Rate limiting          | ❌ Declined | Interactive human-supervised workflow naturally throttles; not mass scraping               |
| CSP validation         | ⚠️ Partial  | Added note in Phase 3: test blob fetch on first image, fall back to screenshots if blocked |

### Changes Made to Plan

1. **Phase 3**: Added CSP validation note for blob fetching with screenshot fallback
2. **Phase 3**: Added resumption strategy note (hash-based deduplication)
3. **Phase 5**: Replaced manual JSON editing with HTML curation tool (promoted from backlog)
4. **Backlog**: Updated image processing item to clarify it runs after curation, with specific specs
