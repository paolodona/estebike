/**
 * Image processing module for blog migration
 *
 * Note: Uses simple file copy instead of sharp due to compatibility issues.
 * Astro will handle image optimization at build time.
 */

import fs from 'fs/promises';
import path from 'path';
import { config, thumbnailPattern } from './config.js';
import type { ImageInfo } from './types.js';

/**
 * Extract image information from content HTML
 */
export function extractImages(
  htmlContent: string,
  postSlug: string
): ImageInfo[] {
  const images: ImageInfo[] = [];
  const seen = new Set<string>();

  // Match all image sources (src and srcset)
  const imgRegex = /(?:src|srcset)=["']([^"']+)["']/gi;
  let match;

  while ((match = imgRegex.exec(htmlContent)) !== null) {
    const srcValue = match[1];

    // Handle srcset (multiple URLs)
    const urls = srcValue.includes(',')
      ? srcValue.split(',').map((s) => s.trim().split(' ')[0])
      : [srcValue];

    for (const url of urls) {
      const info = parseImagePath(url);
      if (info && !seen.has(info.originalPath)) {
        seen.add(info.originalPath);
        images.push(info);
      }
    }
  }

  return images;
}

/**
 * Parse an image URL/path and extract metadata
 */
function parseImagePath(url: string): ImageInfo | null {
  // Match wp-content/uploads pattern with year/month
  const match = url.match(
    /(?:\.\.\/)*(?:https?:\/\/[^/]+\/)?(?:wp-content\/uploads\/)?(\d{4})\/(\d{2})\/([^"'\s?]+)/
  );

  if (!match) return null;

  const [, year, month, filename] = match;

  // Check if this is a WordPress thumbnail
  const isThumbnail = thumbnailPattern.test(filename);

  // Reconstruct the relative path as it appears in HTML
  const originalPath = url.includes('wp-content')
    ? url
    : `../wp-content/uploads/${year}/${month}/${filename}`;

  return {
    originalPath,
    year,
    month,
    filename,
    newPath: `/images/blog/${year}/${month}/${filename}`,
    isThumbnail,
  };
}

/**
 * Get the original (non-thumbnail) filename
 * Converts image-300x200.jpg to image.jpg
 */
export function getOriginalFilename(filename: string): string {
  return filename.replace(/-\d+x\d+(\.[a-z]+)$/i, '$1');
}

/**
 * Process a single image: copy to destination
 * (Resizing disabled due to sharp compatibility issues - Astro handles optimization)
 */
export async function processImage(
  imageInfo: ImageInfo,
  dryRun: boolean
): Promise<{ processed: boolean; resized: boolean; error?: string }> {
  // Skip thumbnails - we'll use the original
  if (imageInfo.isThumbnail) {
    return { processed: false, resized: false };
  }

  const sourcePath = path.join(
    config.crawledSitePath,
    'wp-content/uploads',
    imageInfo.year,
    imageInfo.month,
    imageInfo.filename
  );

  const destDir = path.join(
    config.imageOutputPath,
    imageInfo.year,
    imageInfo.month
  );
  const destPath = path.join(destDir, imageInfo.filename);

  if (dryRun) {
    // Check if source exists
    try {
      await fs.access(sourcePath);
      return { processed: true, resized: false };
    } catch {
      return {
        processed: false,
        resized: false,
        error: `Source not found: ${sourcePath}`,
      };
    }
  }

  try {
    // Check if source exists
    await fs.access(sourcePath);

    // Create destination directory
    await fs.mkdir(destDir, { recursive: true });

    // Check if already processed
    try {
      await fs.access(destPath);
      return { processed: true, resized: false };
    } catch {
      // File doesn't exist, continue processing
    }

    // Copy image as-is (Astro will optimize at build time)
    await fs.copyFile(sourcePath, destPath);

    return { processed: true, resized: false };
  } catch (error) {
    return {
      processed: false,
      resized: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Process all images for a post
 */
export async function processPostImages(
  images: ImageInfo[],
  dryRun: boolean
): Promise<{
  processed: number;
  skipped: number;
  resized: number;
  errors: Array<{ path: string; error: string }>;
}> {
  const results = {
    processed: 0,
    skipped: 0,
    resized: 0,
    errors: [] as Array<{ path: string; error: string }>,
  };

  // Get unique non-thumbnail images
  const uniqueImages = images.filter((img) => !img.isThumbnail);
  const seen = new Set<string>();

  for (const img of uniqueImages) {
    const key = `${img.year}/${img.month}/${img.filename}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const result = await processImage(img, dryRun);

    if (result.error) {
      results.errors.push({ path: img.originalPath, error: result.error });
    } else if (result.processed) {
      results.processed++;
      if (result.resized) results.resized++;
    } else {
      results.skipped++;
    }
  }

  // Count skipped thumbnails
  results.skipped += images.filter((img) => img.isThumbnail).length;

  return results;
}

/**
 * Rewrite image paths in HTML content
 * Converts ../wp-content/uploads/2015/06/image.jpg to /images/blog/2015/06/image.jpg
 * Also removes thumbnail suffixes from filenames
 */
export function rewriteImagePaths(htmlContent: string): string {
  // Replace all wp-content/uploads paths
  return htmlContent.replace(
    /(?:\.\.\/)*(?:https?:\/\/[^/]+\/)?wp-content\/uploads\/(\d{4})\/(\d{2})\/([^"'\s?]+)/gi,
    (match, year, month, filename) => {
      // Convert thumbnail to original filename
      const originalFilename = getOriginalFilename(filename);
      return `/images/blog/${year}/${month}/${originalFilename}`;
    }
  );
}
