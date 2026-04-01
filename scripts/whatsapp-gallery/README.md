# WhatsApp Gallery Scraper

Interactive workflow to extract images from WhatsApp Web using Chrome DevTools MCP, with AI-powered cataloging for website curation.

## Prerequisites

- Chrome browser open with Chrome DevTools MCP connected
- WhatsApp Web logged in (web.whatsapp.com)
- EsteBike group chat open

## Workflow

1. **Setup**: Open Chrome and connect Chrome DevTools MCP
2. **Login**: Log into WhatsApp Web manually (scan QR code)
3. **Navigate**: Open the EsteBike group chat
4. **Scrape**: Ask Claude to start the scraping process
5. **Claude will**:
   - Scroll through chat to find images
   - Open each image in full-res viewer
   - Download to `/downloads/`
   - Analyze with AI vision
   - Update `catalog.json`
6. **Curate**: Open `curate.html` in browser to review images
7. **Approve/Reject**: Mark images for website use
8. **Export**: Copy approved images to website gallery

## Directory Structure

```
/scripts/whatsapp-gallery/
  /downloads/           # Downloaded images from WhatsApp
  catalog.json          # AI-generated metadata + curation status
  curate.html           # Visual curation interface
  README.md             # This file
```

## Catalog Fields

Each image in `catalog.json` has:

### Basic Info
- `id`: Unique identifier (e.g., "img_001")
- `filename`: Local filename in downloads/
- `downloaded_at`: ISO timestamp
- `file_size_bytes`: File size
- `dimensions`: Width x height

### AI Analysis
- `description`: 1-2 sentence scene description
- `has_estebike_kit`: Boolean - subjects wearing EsteBike jersey?
- `kit_confidence`: 0-1 confidence score
- `website_relevance`: 1-10 score (9-10 = professional quality, 7-8 = good, 5-6 = acceptable, 3-4 = low quality, 1-2 = not suitable)
- `suggested_tags`: Array of category tags
- `faces_detected`: Number of people visible
- `scene_type`: outdoor_cycling, event, group_photo, landscape, etc.

### Curation (User-Edited)
- `approved`: null (pending), true (use on website), false (rejected)
- `target_gallery`: e.g., "magna-pedala-2024", "general"
- `notes`: Curator comments

## Kit Detection

EsteBike kit identification:
- Yellow jersey with red cross pattern
- High confidence: Kit clearly visible
- Medium confidence: Partially visible or uncertain
- Low confidence: No kit visible

## Resuming After Interruption

If the scraping is interrupted:
1. Existing `catalog.json` preserves progress
2. Images already downloaded are tracked by SHA256 hash
3. Re-running will automatically skip duplicates
4. Scroll through chat again to continue where you left off

## Privacy Notes

- Downloaded images stay local, never auto-uploaded
- Must manually curate before any website use
- Consider face blur for non-consenting subjects (future feature)
