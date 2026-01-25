/**
 * HTML to Markdown conversion module
 */

import TurndownService from 'turndown';
import { rewriteImagePaths } from './images.js';

/**
 * Create a configured Turndown service for HTML to Markdown conversion
 */
function createTurndownService(): TurndownService {
  const turndown = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
    emDelimiter: '*',
  });

  // Remove srcset attributes (we don't need responsive image sets)
  turndown.addRule('cleanImages', {
    filter: 'img',
    replacement: (content, node) => {
      const el = node as HTMLImageElement;
      const src = el.getAttribute('src') || '';
      const alt = el.getAttribute('alt') || '';
      return `![${alt}](${src})`;
    },
  });

  // Handle WordPress alignment classes
  turndown.addRule('alignedImages', {
    filter: (node) => {
      return (
        node.nodeName === 'IMG' &&
        (node.className?.includes('alignleft') ||
          node.className?.includes('alignright') ||
          node.className?.includes('aligncenter'))
      );
    },
    replacement: (content, node) => {
      const el = node as HTMLImageElement;
      const src = el.getAttribute('src') || '';
      const alt = el.getAttribute('alt') || '';
      return `![${alt}](${src})`;
    },
  });

  // Handle figure/figcaption
  turndown.addRule('figure', {
    filter: 'figure',
    replacement: (content, node) => {
      const el = node as HTMLElement;
      const img = el.querySelector('img');
      const caption = el.querySelector('figcaption');

      if (img) {
        const src = img.getAttribute('src') || '';
        const alt = caption?.textContent?.trim() || img.getAttribute('alt') || '';
        return `![${alt}](${src})${caption ? `\n*${caption.textContent?.trim()}*` : ''}\n\n`;
      }

      return content + '\n\n';
    },
  });

  // Remove WordPress shortcodes
  turndown.addRule('shortcodes', {
    filter: (node) => {
      const text = node.textContent || '';
      return text.startsWith('[') && text.includes(']');
    },
    replacement: (content) => {
      // Remove shortcode brackets but keep text content between them
      return content.replace(/\[[^\]]+\]/g, '').trim();
    },
  });

  // Handle gallery elements
  turndown.addRule('gallery', {
    filter: (node) => {
      return node.className?.includes('gallery') || node.className?.includes('carousel');
    },
    replacement: (content, node) => {
      // Extract images from gallery
      const el = node as HTMLElement;
      const images = el.querySelectorAll('img');
      let md = '';

      images.forEach((img) => {
        const src = img.getAttribute('src') || '';
        const alt = img.getAttribute('alt') || '';
        // Skip thumbnail versions
        if (!src.match(/-\d+x\d+\./)) {
          md += `![${alt}](${src})\n\n`;
        }
      });

      return md || '';
    },
  });

  // Clean up excessive whitespace
  turndown.addRule('cleanWhitespace', {
    filter: ['p', 'div'],
    replacement: (content, node) => {
      const el = node as HTMLElement;
      // Don't process divs that might be containers
      if (el.nodeName === 'DIV' && el.className) {
        return content;
      }
      return content.trim() + '\n\n';
    },
  });

  return turndown;
}

/**
 * Convert HTML content to Markdown
 */
export function htmlToMarkdown(html: string): string {
  // First, rewrite image paths
  const rewrittenHtml = rewriteImagePaths(html);

  // Remove any script tags that might have snuck through
  const cleanHtml = rewrittenHtml
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  const turndown = createTurndownService();
  let markdown = turndown.turndown(cleanHtml);

  // Post-processing cleanup
  markdown = markdown
    // Remove excessive newlines
    .replace(/\n{3,}/g, '\n\n')
    // Remove empty links
    .replace(/\[([^\]]*)\]\(\s*\)/g, '$1')
    // Clean up any remaining HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    // Trim whitespace
    .trim();

  return markdown;
}

/**
 * Generate frontmatter YAML from post metadata
 */
export function generateFrontmatter(post: {
  title: string;
  date: string;
  author: string;
  category: string;
  tags: string[];
  image: string | null;
  excerpt?: string;
}): string {
  const lines = ['---'];

  // Title (escape quotes)
  lines.push(`title: "${post.title.replace(/"/g, '\\"')}"`);

  // Date
  lines.push(`date: ${post.date}`);

  // Author
  lines.push(`author: ${post.author}`);

  // Category
  lines.push(`category: ${post.category}`);

  // Tags (if any)
  if (post.tags.length > 0) {
    lines.push('tags:');
    post.tags.forEach((tag) => {
      lines.push(`  - ${tag}`);
    });
  }

  // Featured image (if any)
  if (post.image) {
    // Rewrite image path and remove thumbnail suffix
    let imagePath = post.image;
    const match = imagePath.match(/wp-content\/uploads\/(\d{4})\/(\d{2})\/([^"'\s?]+)/);
    if (match) {
      const filename = match[3].replace(/-\d+x\d+(\.[a-z]+)$/i, '$1');
      imagePath = `/images/blog/${match[1]}/${match[2]}/${filename}`;
    }
    lines.push(`image: "${imagePath}"`);
  }

  // Excerpt (if any)
  if (post.excerpt) {
    lines.push(`excerpt: "${post.excerpt.replace(/"/g, '\\"')}"`);
  }

  lines.push('---');

  return lines.join('\n');
}
