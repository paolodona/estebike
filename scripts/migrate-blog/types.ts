/**
 * TypeScript interfaces for blog migration
 */

export interface LegacyPost {
  /** Directory name from crawled site (used as slug) */
  slug: string;
  /** Full path to the index.html file */
  filePath: string;
  /** Raw HTML content */
  html: string;
}

export interface ParsedPost {
  /** Post slug extracted from directory name */
  slug: string;
  /** Post title */
  title: string;
  /** Publication date (ISO format YYYY-MM-DD) */
  date: string;
  /** Author name */
  author: string;
  /** Category (mapped to Astro schema) */
  category: AstroCategory;
  /** Tags array */
  tags: string[];
  /** Featured image path (og:image or first content image) */
  image: string | null;
  /** HTML content from entry-content div */
  htmlContent: string;
  /** Optional excerpt from og:description */
  excerpt?: string;
}

export interface ProcessedPost extends ParsedPost {
  /** Markdown content (converted from HTML) */
  markdownContent: string;
  /** List of images found in content */
  images: ImageInfo[];
}

export interface ImageInfo {
  /** Original URL/path from HTML */
  originalPath: string;
  /** Year extracted from path (e.g., 2015) */
  year: string;
  /** Month extracted from path (e.g., 06) */
  month: string;
  /** Original filename */
  filename: string;
  /** New path in public folder */
  newPath: string;
  /** Whether this is a WordPress thumbnail */
  isThumbnail: boolean;
}

export interface MigrationReport {
  /** Total posts found */
  totalPosts: number;
  /** Successfully migrated posts */
  successCount: number;
  /** Skipped (already exist) */
  skippedCount: number;
  /** Failed migrations */
  failedCount: number;
  /** List of failed posts with errors */
  failures: Array<{
    slug: string;
    error: string;
  }>;
  /** Image statistics */
  images: {
    total: number;
    processed: number;
    skipped: number;
    resized: number;
    errors: number;
  };
  /** Category mapping warnings */
  categoryWarnings: Array<{
    slug: string;
    original: string;
    mapped: AstroCategory;
  }>;
}

export type AstroCategory =
  | 'Comunicato del direttivo'
  | 'News'
  | 'Coppa Colli Euganei'
  | 'Convenzioni';

export interface MigrationConfig {
  /** Path to crawled site */
  crawledSitePath: string;
  /** Output path for blog posts */
  blogOutputPath: string;
  /** Output path for images */
  imageOutputPath: string;
  /** Maximum image width */
  maxImageWidth: number;
  /** Dry run mode (no file writes) */
  dryRun: boolean;
  /** Single slug to process (for testing) */
  singleSlug?: string;
}
