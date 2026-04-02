/**
 * HTML parsing module for extracting metadata from legacy WordPress posts
 */

import * as cheerio from 'cheerio';
import type { AstroCategory, LegacyPost, ParsedPost } from './types.js';
import { categoryMap, defaultCategory } from './config.js';

/**
 * Parse a legacy HTML post and extract metadata
 */
export function parsePost(post: LegacyPost): ParsedPost {
  const $ = cheerio.load(post.html);

  const title = extractTitle($);
  const date = extractDate($);
  const author = extractAuthor($);
  const { category, originalCategory } = extractCategory($);
  const tags = extractTags($);
  const image = extractFeaturedImage($);
  const htmlContent = extractContent($);
  const excerpt = extractExcerpt($);

  return {
    slug: post.slug,
    title,
    date,
    author,
    category,
    tags,
    image,
    htmlContent,
    excerpt,
  };
}

/**
 * Extract post title
 * Priority: h1.entry-title > meta og:title > title tag
 */
function extractTitle($: cheerio.CheerioAPI): string {
  // Try h1.entry-title first
  const h1Title = $('h1.entry-title').text().trim();
  if (h1Title) return h1Title;

  // Try meta og:title
  const ogTitle = $('meta[property="og:title"]').attr('content');
  if (ogTitle) {
    // Remove site name suffix if present
    const cleaned = ogTitle.split(' - ')[0].trim();
    return cleaned;
  }

  // Fall back to title tag
  const titleTag = $('title').text().trim();
  if (titleTag) {
    const cleaned = titleTag.split(' - ')[0].trim();
    return cleaned;
  }

  return 'Untitled';
}

/**
 * Extract publication date
 * Priority: meta[itemprop="datePublished"] > meta[property="article:published_time"]
 */
function extractDate($: cheerio.CheerioAPI): string {
  // Try itemprop datePublished
  const datePublished = $('meta[itemprop="datePublished"]').attr('content');
  if (datePublished) {
    return formatDate(datePublished);
  }

  // Try article:published_time
  const articleTime = $('meta[property="article:published_time"]').attr(
    'content'
  );
  if (articleTime) {
    return formatDate(articleTime);
  }

  // Default to current date if not found
  return new Date().toISOString().split('T')[0];
}

/**
 * Format ISO date string to YYYY-MM-DD
 */
function formatDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    return date.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Extract author name
 */
function extractAuthor($: cheerio.CheerioAPI): string {
  // Try itemprop author
  const authorSpan = $('span[itemprop="author"]').text().trim();
  if (authorSpan) return authorSpan;

  // Try author link
  const authorLink = $('span[itemprop="author"] a, .author a, .postauthortop a')
    .first()
    .text()
    .trim();
  if (authorLink) return authorLink;

  return 'admin';
}

/**
 * Extract category and map to Astro schema
 * Returns both the mapped category and original for logging
 */
function extractCategory($: cheerio.CheerioAPI): {
  category: AstroCategory;
  originalCategory: string;
} {
  // Try meta article:section
  const articleSection = $('meta[property="article:section"]').attr('content');
  if (articleSection) {
    return mapCategory(articleSection);
  }

  // Try category link
  const categoryLink = $('a[rel="category tag"]').first().text().trim();
  if (categoryLink) {
    return mapCategory(categoryLink);
  }

  // Try body classes
  const bodyClass = $('body').attr('class') || '';
  const categoryMatch = bodyClass.match(/category-([a-z-]+)/);
  if (categoryMatch) {
    return mapCategory(categoryMatch[1].replace(/-/g, ' '));
  }

  return { category: defaultCategory, originalCategory: 'unknown' };
}

/**
 * Map a category string to Astro category enum
 */
function mapCategory(original: string): {
  category: AstroCategory;
  originalCategory: string;
} {
  const normalized = original.toLowerCase().trim();

  // Direct match
  if (categoryMap[normalized]) {
    return { category: categoryMap[normalized], originalCategory: original };
  }

  // Partial match
  for (const [key, value] of Object.entries(categoryMap)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return { category: value, originalCategory: original };
    }
  }

  return { category: defaultCategory, originalCategory: original };
}

/**
 * Extract tags from meta tags and post footer
 */
function extractTags($: cheerio.CheerioAPI): string[] {
  const tags = new Set<string>();

  // From meta tags
  $('meta[property="article:tag"]').each((_, el) => {
    const tag = $(el).attr('content');
    if (tag) tags.add(tag.trim());
  });

  // From post footer links
  $('span.posttags a[rel="tag"], .posttags a').each((_, el) => {
    const tag = $(el).text().trim();
    if (tag) tags.add(tag);
  });

  return Array.from(tags);
}

/**
 * Extract featured image
 * Priority: og:image > first image in content
 */
function extractFeaturedImage($: cheerio.CheerioAPI): string | null {
  // Try og:image
  const ogImage = $('meta[property="og:image"]').attr('content');
  if (ogImage) {
    return normalizeImagePath(ogImage);
  }

  // Try first image in entry-content
  const firstContentImage = $('.entry-content img').first().attr('src');
  if (firstContentImage) {
    return normalizeImagePath(firstContentImage);
  }

  return null;
}

/**
 * Normalize image path for later processing
 * Extracts the wp-content/uploads portion
 */
function normalizeImagePath(url: string): string {
  // Handle various URL formats
  const match = url.match(/wp-content\/uploads\/(\d{4})\/(\d{2})\/([^"'\s?]+)/);
  if (match) {
    return `wp-content/uploads/${match[1]}/${match[2]}/${match[3]}`;
  }
  return url;
}

/**
 * Extract main content HTML
 */
function extractContent($: cheerio.CheerioAPI): string {
  const entryContent = $('.entry-content');

  if (entryContent.length === 0) {
    return '';
  }

  // Clone to avoid modifying original
  const content = entryContent.clone();

  // Remove unwanted elements
  content.find('script, style, .share-buttons, .social-share').remove();

  return content.html() || '';
}

/**
 * Extract excerpt from og:description
 */
function extractExcerpt($: cheerio.CheerioAPI): string | undefined {
  const ogDesc = $('meta[property="og:description"]').attr('content');
  if (ogDesc) {
    // Clean up WordPress ellipsis
    let cleaned = ogDesc
      .replace(/&hellip;/g, '...')
      .replace(/\s*\.\.\.\s*$/, '');
    // Truncate if too long
    if (cleaned.length > 200) {
      cleaned = cleaned.substring(0, 197) + '...';
    }
    return cleaned;
  }
  return undefined;
}
