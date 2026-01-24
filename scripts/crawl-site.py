#!/usr/bin/env python3
"""
Full website crawler for estebike.it
Creates a complete mirror of the site for reference and asset reuse

Usage:
    pip install requests beautifulsoup4 lxml
    python crawl-site.py
"""

import os
import re
import ssl
import time
import random
import hashlib
import logging
import urllib.request
from pathlib import Path
from urllib.parse import urljoin, urlparse, unquote
from collections import deque
from concurrent.futures import ThreadPoolExecutor, as_completed

try:
    import requests
    from bs4 import BeautifulSoup
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False

# Configuration
SITE_URL = "https://www.estebike.it/"
OUTPUT_DIR = Path("./crawled-site/www.estebike.it")
LOG_FILE = Path("./crawl.log")
MAX_WORKERS = 4
DELAY_MIN = 0.5
DELAY_MAX = 1.5
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE, encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# File extensions to download
ASSET_EXTENSIONS = {
    '.css', '.js', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico',
    '.woff', '.woff2', '.ttf', '.eot', '.otf',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx',
    '.mp4', '.webm', '.mp3', '.wav',
    '.json', '.xml', '.txt'
}

HTML_EXTENSIONS = {'.html', '.htm', '.php', '.asp', '.aspx', ''}


class WebsiteCrawler:
    def __init__(self, base_url: str, output_dir: Path):
        self.base_url = base_url
        self.base_domain = urlparse(base_url).netloc
        self.output_dir = output_dir
        self.visited_urls = set()
        self.downloaded_files = set()
        self.queue = deque()
        self.session = None

        # Create SSL context that ignores certificate errors
        self.ssl_context = ssl.create_default_context()
        self.ssl_context.check_hostname = False
        self.ssl_context.verify_mode = ssl.CERT_NONE

        if REQUESTS_AVAILABLE:
            self.session = requests.Session()
            self.session.verify = False
            self.session.headers.update({'User-Agent': USER_AGENT})
            # Suppress SSL warnings
            import urllib3
            urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

    def url_to_filepath(self, url: str) -> Path:
        """Convert URL to local file path."""
        parsed = urlparse(url)
        path = unquote(parsed.path)

        if not path or path.endswith('/'):
            path = path + 'index.html'
        elif '.' not in Path(path).name:
            path = path + '/index.html'

        # Handle query strings by hashing them
        if parsed.query:
            query_hash = hashlib.md5(parsed.query.encode()).hexdigest()[:8]
            stem = Path(path).stem
            suffix = Path(path).suffix or '.html'
            path = str(Path(path).parent / f"{stem}_{query_hash}{suffix}")

        # Clean up path
        path = path.lstrip('/')
        filepath = self.output_dir / path

        return filepath

    def fetch_url(self, url: str) -> tuple[bytes | None, str | None]:
        """Fetch URL content, ignoring SSL errors."""
        try:
            if REQUESTS_AVAILABLE:
                response = self.session.get(url, timeout=30)
                response.raise_for_status()
                return response.content, response.headers.get('Content-Type', '')
            else:
                req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
                with urllib.request.urlopen(req, context=self.ssl_context, timeout=30) as response:
                    return response.read(), response.headers.get('Content-Type', '')
        except Exception as e:
            logger.error(f"Failed to fetch {url}: {e}")
            return None, None

    def save_file(self, filepath: Path, content: bytes):
        """Save content to file."""
        filepath.parent.mkdir(parents=True, exist_ok=True)
        filepath.write_bytes(content)
        logger.info(f"Saved: {filepath}")

    def is_same_domain(self, url: str) -> bool:
        """Check if URL belongs to the same domain."""
        parsed = urlparse(url)
        return parsed.netloc == self.base_domain or parsed.netloc == ''

    def extract_links(self, html: str, base_url: str) -> set[str]:
        """Extract all links from HTML content."""
        links = set()

        if REQUESTS_AVAILABLE:
            soup = BeautifulSoup(html, 'lxml')

            # Extract href links
            for tag in soup.find_all(['a', 'link'], href=True):
                href = tag['href']
                full_url = urljoin(base_url, href)
                links.add(full_url)

            # Extract src links (images, scripts, etc.)
            for tag in soup.find_all(['img', 'script', 'source', 'video', 'audio'], src=True):
                src = tag['src']
                full_url = urljoin(base_url, src)
                links.add(full_url)

            # Extract srcset images
            for tag in soup.find_all(['img', 'source'], srcset=True):
                srcset = tag['srcset']
                for item in srcset.split(','):
                    src = item.strip().split()[0]
                    full_url = urljoin(base_url, src)
                    links.add(full_url)

            # Extract CSS url() references
            for tag in soup.find_all('style'):
                if tag.string:
                    links.update(self.extract_css_urls(tag.string, base_url))

            # Extract inline style url() references
            for tag in soup.find_all(style=True):
                links.update(self.extract_css_urls(tag['style'], base_url))

            # Extract data-src (lazy loading)
            for tag in soup.find_all(attrs={'data-src': True}):
                full_url = urljoin(base_url, tag['data-src'])
                links.add(full_url)

            # Extract background images from style attributes
            for tag in soup.find_all(attrs={'data-background': True}):
                full_url = urljoin(base_url, tag['data-background'])
                links.add(full_url)
        else:
            # Fallback regex-based extraction
            patterns = [
                r'href=["\']([^"\']+)["\']',
                r'src=["\']([^"\']+)["\']',
                r'url\(["\']?([^"\')\s]+)["\']?\)',
            ]
            for pattern in patterns:
                for match in re.findall(pattern, html, re.IGNORECASE):
                    full_url = urljoin(base_url, match)
                    links.add(full_url)

        return links

    def extract_css_urls(self, css: str, base_url: str) -> set[str]:
        """Extract url() references from CSS content."""
        urls = set()
        pattern = r'url\(["\']?([^"\')\s]+)["\']?\)'
        for match in re.findall(pattern, css, re.IGNORECASE):
            if not match.startswith('data:'):
                full_url = urljoin(base_url, match)
                urls.add(full_url)
        return urls

    def should_crawl(self, url: str) -> bool:
        """Determine if URL should be crawled."""
        parsed = urlparse(url)

        # Skip non-http(s) URLs
        if parsed.scheme not in ('http', 'https', ''):
            return False

        # Skip external domains
        if not self.is_same_domain(url):
            return False

        # Skip already visited
        if url in self.visited_urls:
            return False

        # Skip anchors on same page
        if '#' in url:
            url = url.split('#')[0]
            if url in self.visited_urls:
                return False

        return True

    def crawl(self):
        """Main crawl loop."""
        logger.info(f"Starting crawl of {self.base_url}")
        logger.info(f"Output directory: {self.output_dir}")

        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.queue.append(self.base_url)

        pages_crawled = 0
        assets_downloaded = 0

        while self.queue:
            url = self.queue.popleft()

            # Clean URL
            url = url.split('#')[0]

            if url in self.visited_urls:
                continue

            self.visited_urls.add(url)

            # Polite delay
            time.sleep(random.uniform(DELAY_MIN, DELAY_MAX))

            logger.info(f"Crawling: {url}")
            content, content_type = self.fetch_url(url)

            if content is None:
                continue

            # Determine file path
            filepath = self.url_to_filepath(url)

            # Check if it's HTML content
            is_html = (
                content_type and 'text/html' in content_type.lower()
            ) or filepath.suffix.lower() in HTML_EXTENSIONS

            if is_html:
                pages_crawled += 1
                # Parse and extract links
                try:
                    html_text = content.decode('utf-8', errors='replace')
                except:
                    html_text = content.decode('latin-1', errors='replace')

                links = self.extract_links(html_text, url)

                for link in links:
                    if self.should_crawl(link):
                        self.queue.append(link)

                # Ensure .html extension for HTML files
                if not filepath.suffix:
                    filepath = filepath.with_suffix('.html')
            else:
                assets_downloaded += 1

            # Save file
            self.save_file(filepath, content)
            self.downloaded_files.add(str(filepath))

        return pages_crawled, assets_downloaded

    def print_summary(self, pages: int, assets: int):
        """Print crawl summary."""
        print("\n" + "=" * 50)
        print("CRAWL COMPLETE")
        print("=" * 50)
        print(f"\nPages crawled: {pages}")
        print(f"Assets downloaded: {assets}")
        print(f"Total files: {len(self.downloaded_files)}")

        if self.output_dir.exists():
            # Count by type
            files = list(self.output_dir.rglob('*'))
            files = [f for f in files if f.is_file()]

            html_count = len([f for f in files if f.suffix.lower() in {'.html', '.htm'}])
            img_count = len([f for f in files if f.suffix.lower() in {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'}])
            css_count = len([f for f in files if f.suffix.lower() == '.css'])
            js_count = len([f for f in files if f.suffix.lower() == '.js'])
            pdf_count = len([f for f in files if f.suffix.lower() == '.pdf'])

            print(f"\nHTML files: {html_count}")
            print(f"Images: {img_count}")
            print(f"CSS files: {css_count}")
            print(f"JS files: {js_count}")
            print(f"PDF files: {pdf_count}")

            # Total size
            total_size = sum(f.stat().st_size for f in files)
            size_mb = total_size / (1024 * 1024)
            print(f"\nTotal size: {size_mb:.2f} MB")

        print(f"\nFiles saved to: {self.output_dir.absolute()}")


def main():
    print("=" * 50)
    print("Estebike.it Website Crawler")
    print("=" * 50)
    print(f"\nTarget: {SITE_URL}")
    print(f"Output: {OUTPUT_DIR}")
    print(f"Log: {LOG_FILE}")

    if not REQUESTS_AVAILABLE:
        print("\nWARNING: 'requests' and 'beautifulsoup4' not installed.")
        print("Install them for better crawling:")
        print("  pip install requests beautifulsoup4 lxml")
        print("\nUsing fallback mode with limited functionality.\n")

    crawler = WebsiteCrawler(SITE_URL, OUTPUT_DIR)
    pages, assets = crawler.crawl()
    crawler.print_summary(pages, assets)


if __name__ == '__main__':
    main()
