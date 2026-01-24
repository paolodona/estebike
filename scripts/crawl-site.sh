#!/bin/bash
# Full website crawler for estebike.it
# Creates a complete mirror of the site for reference and asset reuse

SITE_URL="https://www.estebike.it/"
OUTPUT_DIR="./crawled-site"
LOG_FILE="./crawl.log"

echo "=========================================="
echo "Estebike.it Website Crawler"
echo "=========================================="
echo ""
echo "Target: $SITE_URL"
echo "Output: $OUTPUT_DIR"
echo "Log:    $LOG_FILE"
echo ""

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo "Starting crawl at $(date)"
echo ""

# wget options explained:
# --mirror (-m)           : Turn on mirroring (recursive, timestamping, infinite depth)
# --convert-links (-k)    : Convert links for local viewing
# --adjust-extension (-E) : Save HTML/CSS with proper extensions
# --page-requisites (-p)  : Download all assets needed to display pages
# --no-parent (-np)       : Don't ascend to parent directory
# --no-check-certificate  : Ignore SSL certificate errors
# --wait                  : Wait between requests (be polite)
# --random-wait           : Randomize wait time
# --limit-rate            : Limit download speed
# --user-agent            : Set a browser-like user agent
# --execute robots=off    : Ignore robots.txt restrictions
# --reject                : Skip certain file types if needed
# --directory-prefix      : Where to save files

wget \
    --mirror \
    --convert-links \
    --adjust-extension \
    --page-requisites \
    --no-parent \
    --no-check-certificate \
    --wait=1 \
    --random-wait \
    --limit-rate=500k \
    --user-agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" \
    --execute robots=off \
    --directory-prefix="$OUTPUT_DIR" \
    --no-verbose \
    --show-progress \
    "$SITE_URL" 2>&1 | tee "$LOG_FILE"

echo ""
echo "=========================================="
echo "Crawl completed at $(date)"
echo "=========================================="
echo ""
echo "Files saved to: $OUTPUT_DIR/www.estebike.it/"
echo ""

# Show summary
if [ -d "$OUTPUT_DIR/www.estebike.it" ]; then
    echo "Summary:"
    echo "--------"
    echo "Total files: $(find "$OUTPUT_DIR/www.estebike.it" -type f | wc -l)"
    echo "HTML files:  $(find "$OUTPUT_DIR/www.estebike.it" -name "*.html" -o -name "*.htm" | wc -l)"
    echo "Images:      $(find "$OUTPUT_DIR/www.estebike.it" \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.gif" -o -name "*.webp" -o -name "*.svg" \) | wc -l)"
    echo "CSS files:   $(find "$OUTPUT_DIR/www.estebike.it" -name "*.css" | wc -l)"
    echo "JS files:    $(find "$OUTPUT_DIR/www.estebike.it" -name "*.js" | wc -l)"
    echo "PDF files:   $(find "$OUTPUT_DIR/www.estebike.it" -name "*.pdf" | wc -l)"
    echo ""
    echo "Total size:  $(du -sh "$OUTPUT_DIR/www.estebike.it" | cut -f1)"
fi
