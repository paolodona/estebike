# Implementation Plan: WhatsApp Gallery Scraper

Plan: 003 | Name: whatsapp-gallery-scraper | Created: 2026-01-25 | Status: IN PROGRESS | GitRef: 0238b1e

## Related Files

- **Prompt**: `.agent_session/003_whatsapp-gallery-scraper_prompt.md` - Original mission
- **Context**: `.agent_session/003_whatsapp-gallery-scraper_context.md` - Research findings

---

## Overview

Create a Claude-assisted interactive workflow to extract images from WhatsApp Web using Chrome DevTools MCP, download them locally, and catalog them with AI-generated metadata (descriptions, kit detection, relevance scores) for future website gallery integration.

**Why interactive vs. standalone script?** WhatsApp Web requires manual authentication and has a complex, dynamic UI that changes frequently. An interactive Claude-driven approach is more robust and adaptable than a brittle automation script.

## Affected Areas

| Area/Module                  | Affected  | Scope                                    |
| ---------------------------- | --------- | ---------------------------------------- |
| `/scripts/whatsapp-gallery/` | Yes (new) | New directory for all scraping utilities |
| Website gallery              | No        | Future integration only                  |
| Chrome browser               | Yes       | User's browser via MCP                   |

## Current State → Desired End State

**Current**: Photos exist only in WhatsApp group chat, not accessible for website
**Desired**: Photos downloaded locally, cataloged with AI metadata, ready for human curation and website upload
**Key Discoveries**:

- `docs/DESIGN.md:570-583` - Image specs: 1200px max, WebP, 80% compression
- Chrome DevTools MCP provides all needed tools (snapshot, click, evaluate_script, screenshot)

## What We're NOT Doing

- WhatsApp authentication automation (user logs in manually)
- Website gallery implementation (separate plan)
- Video extraction (images only)
- Automatic upload to website (manual curation required)
- Face blur utility (backlog item)

## Code Placement & Architecture

| Component           | Location                                 | Justification                        |
| ------------------- | ---------------------------------------- | ------------------------------------ |
| Download directory  | `/scripts/whatsapp-gallery/downloads/`   | Isolated from website content        |
| Catalog file        | `/scripts/whatsapp-gallery/catalog.json` | Portable JSON format                 |
| README/Instructions | `/scripts/whatsapp-gallery/README.md`    | User workflow documentation          |
| Helper scripts      | `/scripts/whatsapp-gallery/`             | Image processing utilities if needed |

## Catalog Schema

```json
{
  "metadata": {
    "exported_at": "2026-01-25T10:30:00Z",
    "source": "whatsapp-web",
    "group_name": "EsteBike",
    "total_images": 150,
    "curated_count": 0
  },
  "images": [
    {
      "id": "img_001",
      "filename": "2024-05-15_14-32-00_abc123.jpg",
      "original_url": "blob:...",
      "hash": "sha256:...",
      "downloaded_at": "2026-01-25T10:30:00Z",
      "file_size_bytes": 245000,
      "dimensions": {
        "width": 1920,
        "height": 1080
      },
      "ai_analysis": {
        "description": "Group of cyclists at summit with mountain backdrop",
        "has_estebike_kit": true,
        "kit_confidence": 0.85,
        "website_relevance": 8,
        "suggested_tags": ["group", "summit", "scenic", "kit"],
        "faces_detected": 6,
        "scene_type": "outdoor_cycling",
        "analyzed_at": "2026-01-25T10:35:00Z"
      },
      "curation": {
        "approved": null,
        "approved_by": null,
        "approved_at": null,
        "notes": null,
        "target_gallery": null
      }
    }
  ]
}
```

## Implementation Approach

**This is NOT a traditional coded solution.** Instead, this plan describes an **interactive workflow** that Claude executes step-by-step using MCP tools, with human oversight at key points.

---

## Phase 1: Setup & Directory Structure

**Goal**: Create the output directory structure and README

**Changes**:

- Create `/scripts/whatsapp-gallery/` directory
- Create `/scripts/whatsapp-gallery/downloads/` subdirectory
- Create `/scripts/whatsapp-gallery/README.md` with usage instructions
- Create empty `/scripts/whatsapp-gallery/catalog.json` template

**README.md Content**:

```markdown
# WhatsApp Gallery Scraper

## Prerequisites

- Chrome browser open with Chrome DevTools MCP connected
- WhatsApp Web logged in (web.whatsapp.com)
- EsteBike group chat open

## Workflow

1. Log into WhatsApp Web manually
2. Navigate to EsteBike group chat
3. Ask Claude to start the scraping process
4. Claude will:
   - Scroll through chat to find images
   - Open each image in full-res viewer
   - Download to /downloads/
   - Analyze with AI vision
   - Update catalog.json
5. Review catalog.json and mark images for approval
6. Copy approved images to website gallery

## Catalog Fields

- `approved`: null (pending), true (use on website), false (rejected)
- `target_gallery`: e.g., "magna-pedala-2024", "general"
- `notes`: curator comments
```

**Success Criteria**:

- Directory structure exists
- README provides clear instructions
- Empty catalog.json with correct schema

---

## Phase 2: WhatsApp Web Navigation & Image Discovery

**Goal**: Navigate WhatsApp Web and identify all images in the chat

**Interactive Steps** (Claude executes with MCP):

1. **Navigate to WhatsApp Web**:

   ```
   mcp__chrome-devtools__navigate_page(url="https://web.whatsapp.com")
   ```

2. **Wait for user to authenticate** (if needed):
   - User scans QR code
   - User confirms ready

3. **Take snapshot to verify page loaded**:

   ```
   mcp__chrome-devtools__take_snapshot()
   ```

4. **User navigates to EsteBike group** (manual step)

5. **Find image elements via JavaScript**:

   ```javascript
   // mcp__chrome-devtools__evaluate_script
   () => {
     const images = document.querySelectorAll('[data-testid="image-thumb"]');
     return Array.from(images).map((img, i) => ({
       index: i,
       src: img.querySelector('img')?.src,
       alt: img.querySelector('img')?.alt,
     }));
   };
   ```

6. **Scroll to load more history**:
   ```
   mcp__chrome-devtools__press_key(key="PageUp")
   ```
   Repeat until no new images appear

**Success Criteria**:

- Can identify image elements in WhatsApp chat
- Can scroll to load older messages
- Image count is tracked

---

## Phase 3: Image Extraction & Download

**Goal**: Extract full-resolution images and save to disk

**Interactive Steps** (for each image):

1. **Click image thumbnail to open viewer**:

   ```
   mcp__chrome-devtools__click(uid="[image-thumb-uid]")
   ```

2. **Wait for viewer to open, get full-res URL**:

   ```javascript
   // mcp__chrome-devtools__evaluate_script
   () => {
     const viewer = document.querySelector('[data-testid="media-viewer"]');
     const img = viewer?.querySelector('img');
     return {
       src: img?.src,
       width: img?.naturalWidth,
       height: img?.naturalHeight,
     };
   };
   ```

3. **Download image via fetch + blob**:

   ```javascript
   // mcp__chrome-devtools__evaluate_script
   async () => {
     const img = document.querySelector('[data-testid="media-viewer"] img');
     const response = await fetch(img.src);
     const blob = await response.blob();
     const reader = new FileReader();
     return new Promise((resolve) => {
       reader.onload = () => resolve(reader.result);
       reader.readAsDataURL(blob);
     });
   };
   ```

   **Note**: On first image, verify blob fetch works. If CSP blocks the fetch, fall back to `take_screenshot(uid=...)` method instead.

4. **Save base64 to file** (Claude writes file with timestamp + hash filename)

5. **Close viewer**:

   ```
   mcp__chrome-devtools__press_key(key="Escape")
   ```

6. **Update catalog.json** with new entry (without AI analysis yet)

**Deduplication**:

- Calculate SHA256 hash of image data
- Check if hash already exists in catalog
- Skip if duplicate

**Resumption**: If interrupted, existing `catalog.json` preserves download progress. Re-scrolling through chat is required, but downloads are automatically skipped via hash deduplication.

**Success Criteria**:

- Images download successfully to `/scripts/whatsapp-gallery/downloads/`
- Filenames follow format: `YYYY-MM-DD_HH-MM-SS_[hash8].jpg`
- No duplicates (verified by hash)
- Catalog tracks all downloads

---

## Phase 4: AI Vision Analysis

**Goal**: Analyze each downloaded image with Claude vision

**For each image in catalog**:

1. **Read image file** (Claude can view images via Read tool)

2. **Generate analysis**:
   - Description: Describe the scene in 1-2 sentences
   - Kit detection: Look for EsteBike jersey (yellow with red cross)
   - Relevance score (1-10): How suitable for website?
   - Tags: Suggested categorization
   - Face count: Number of people visible
   - Scene type: outdoor_cycling, event, group_photo, landscape, etc.

3. **Update catalog.json** with AI analysis fields

**Kit Detection Criteria**:

- EsteBike kit: Yellow jersey with red cross pattern
- High confidence if clearly visible
- Medium if partially visible or uncertain
- Low if no kit visible

**Relevance Scoring Guidelines**:

- 9-10: Professional quality, great composition, shows cycling action or group
- 7-8: Good quality, interesting content, usable for website
- 5-6: Acceptable quality, may need cropping or editing
- 3-4: Low quality but might be historically relevant
- 1-2: Not suitable (blurry, irrelevant content, screenshots)

**Success Criteria**:

- All images have AI analysis in catalog
- Kit detection correctly identifies EsteBike jerseys
- Relevance scores are reasonable

---

## Phase 5: Curation Interface

**Goal**: Provide user-friendly interface to review and approve images

**Claude generates `curate.html`** - a self-contained HTML file with:

- Thumbnail grid of all downloaded images
- AI analysis display (description, relevance score, kit detection)
- Approve/Reject buttons for each image
- Target gallery dropdown (e.g., "magna-pedala-2024", "general")
- Notes text field
- "Save to catalog.json" button (downloads updated JSON)

**HTML Curation Tool Features**:

```html
<!-- Key functionality (Claude generates full file) -->
- Loads catalog.json via fetch or file input - Displays images from downloads/
folder - Color-coded relevance scores (green 7+, yellow 5-6, red <5) - Kit
detection badge (yellow/red for EsteBike kit) - Bulk actions: "Approve all 7+" /
"Reject all <4" - Filter by: pending, approved, rejected, has-kit - Export
updated catalog.json
```

**Process**:

1. Claude generates `/scripts/whatsapp-gallery/curate.html`
2. User opens `curate.html` in browser
3. User reviews images using visual interface
4. User clicks Save to download updated `catalog.json`
5. User replaces old catalog with new one

**Why HTML over direct JSON editing**: Prevents syntax errors that could corrupt the catalog. Provides visual context for curation decisions. Much faster for reviewing 100+ images.

**Success Criteria**:

- HTML curation tool loads catalog and displays images
- User can approve/reject without editing JSON directly
- Updated catalog exports correctly
- No data loss from syntax errors

---

## Testing & Verification

### Manual Testing Checklist

1. [ ] Open Chrome with DevTools MCP connected
2. [ ] Navigate to WhatsApp Web and log in
3. [ ] Open EsteBike group chat
4. [ ] Run Phase 2: Image discovery finds images
5. [ ] Run Phase 3: Download at least 20 images without duplicates
6. [ ] Run Phase 4: AI analysis completes for all images
7. [ ] Catalog JSON is valid and complete
8. [ ] Kit detection correctly identifies 8/10 samples
9. [ ] Relevance scores align with visual quality

### Edge Cases

| Case                    | Expected Behavior             |
| ----------------------- | ----------------------------- |
| WhatsApp not logged in  | Wait for user to authenticate |
| No images in chat       | Report empty result           |
| Image fails to download | Log error, continue with next |
| Duplicate image         | Skip, log as duplicate        |
| Very large image        | Download anyway, note size    |
| Video thumbnail         | Skip, not an image            |

---

## Backlog Items (Out of Scope)

- [ ] **[Plan 003]** Video extraction support
- [ ] **[Plan 003]** Face blur utility for privacy
- [ ] **[Plan 003]** Direct integration with website gallery component
- [ ] **[Plan 003]** Batch re-analysis when AI models improve
- [ ] **[Plan 003]** Thumbnail generation for preview
- [ ] **[Plan 003]** Export approved images to website-ready format (resize to 1200px max, convert to WebP at 80% quality per `docs/DESIGN.md:570-583`) - **Note: Run this AFTER curation, not before, to avoid processing rejected images**
