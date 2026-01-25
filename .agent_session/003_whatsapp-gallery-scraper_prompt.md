# Original Prompt: WhatsApp Gallery Scraper
Plan: 003 | Name: whatsapp-gallery-scraper | Created: 2026-01-25 | GitRef: 0238b1e

## Related Files
- **Context**: `.agent_session/003_whatsapp-gallery-scraper_context.md` - Research findings
- **Plan**: `.agent_session/003_whatsapp-gallery-scraper_plan.md` - Implementation steps

---

## Original User Request

> the estebike group has a whatsapp group (for members only) that is used to communicate and organize events. Good pictures of rides etc are often posted to this group, but are not public. I need a script to fetch all of these images, download them catalogue them and make them available for the website. I will curate them. Ideally they can all be downloaded and iteratively Claude or another AI can inspect them and provide: 1) a description 2) if the subjects were wearing the estebike kit or not 3) a ranking of how relevant the picture could be for the website. Based on this ranking and description / categorization, we will be able to determine if the pictures can be loaded onto the website or not. The chrome devtools mcp could be used to access whatsapp web, and download the pictures (I will log in and point to the correct whatsapp group)

---

## Refined Prompt

Build a script to extract images from WhatsApp Web (via Chrome DevTools MCP), download them locally, and use AI vision to catalog each image with descriptions, kit detection, and website relevance scoring.

**Architectural Mandate**:
This is a standalone utility script, not part of the main Astro website. All scraping/cataloging logic MUST reside in a dedicated `/scripts/whatsapp-gallery/` directory. The output catalog (JSON/CSV) should be structured so it can later integrate with the website's gallery system defined in SPECS.md.

**Pre-Implementation Analysis Required**:
1. **Review existing gallery structure**: Check `docs/SPECS.md` and `docs/DESIGN.md` for how the website gallery is planned. The catalog output format MUST be compatible with future gallery integration.
2. **Analyze Chrome DevTools MCP capabilities**: Understand what tools are available for page interaction, image detection, and file downloading.
3. **Check for existing image processing utilities**: Look for any existing scripts or patterns in the codebase that handle images.

**Goal**:
Create a semi-automated pipeline that:
1. Uses Chrome DevTools MCP to navigate WhatsApp Web (user authenticates manually)
2. Scrolls through chat history to discover all images
3. Downloads images to a local directory with organized naming
4. Runs AI vision analysis on each image to generate metadata
5. Outputs a catalog file for human curation

**Scope**:
- **IN**:
  - WhatsApp Web image scraping via Chrome DevTools MCP
  - Image downloading with deduplication (hash-based)
  - AI-powered image analysis (description, kit detection, relevance score)
  - Catalog generation (JSON format for programmatic use)
  - Clear instructions for user workflow (login, group selection, script execution)
- **OUT**:
  - WhatsApp authentication automation (user logs in manually)
  - Actual website gallery implementation (separate plan)
  - Video extraction (images only for now)
  - Privacy/consent management (user handles curation)

**Success Criteria**:
- **Manual Testing**:
  1. User logs into WhatsApp Web in Chrome
  2. User navigates to EsteBike group chat
  3. Script successfully identifies and downloads at least 20 images
  4. Each downloaded image has a corresponding catalog entry with AI-generated metadata
  5. Catalog JSON is valid and includes all required fields
  6. No duplicate images (verified by hash)
- **Quality Checks**:
  - Kit detection accuracy spot-checked on 10 images
  - Relevance scores appear reasonable for cycling content

**Output Directory Structure**:
```
/scripts/whatsapp-gallery/
  /downloads/           # Raw downloaded images
  /thumbnails/          # Generated thumbnails for preview
  catalog.json          # AI-generated metadata
  catalog-curated.json  # User-curated final selection
  README.md             # Usage instructions
```

**Privacy Considerations**:
- Downloaded images stay local, never auto-uploaded
- User must manually curate before any website use
- Consider adding face-blur utility for non-consenting subjects (backlog item)

**Backlog Items**:
- Video extraction support
- Face blur utility
- Direct integration with website gallery component
- Batch re-analysis when AI models improve
