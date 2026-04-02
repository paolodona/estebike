#!/usr/bin/env tsx
/**
 * Blog Migration Script for EsteBike
 *
 * Migrates legacy WordPress blog posts from crawled-site to Astro content collection.
 *
 * Usage:
 *   npx tsx index.ts [--dry-run] [--force] [--slug <name>]
 *
 * Options:
 *   --dry-run    Preview changes without writing files
 *   --force      Overwrite existing blog posts (default: skip)
 *   --slug       Process only a specific post by slug
 */

import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import { config, excludedDirectories, defaultCategory } from './config.js';
import { parsePost } from './parsers.js';
import { extractImages, processPostImages, rewriteImagePaths } from './images.js';
import { htmlToMarkdown, generateFrontmatter } from './markdown.js';
import type { LegacyPost, MigrationReport, ProcessedPost } from './types.js';

/**
 * Parse command line arguments
 */
function parseArgs(): { dryRun: boolean; force: boolean; slug?: string } {
  const args = process.argv.slice(2);
  let dryRun = false;
  let force = false;
  let slug: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dry-run') {
      dryRun = true;
    } else if (args[i] === '--force') {
      force = true;
    } else if (args[i] === '--slug' && args[i + 1]) {
      slug = args[i + 1];
      i++;
    }
  }

  return { dryRun, force, slug };
}

/**
 * Discover all blog posts in the crawled site
 */
async function discoverPosts(singleSlug?: string): Promise<LegacyPost[]> {
  const posts: LegacyPost[] = [];

  if (singleSlug) {
    const filePath = path.join(config.crawledSitePath, singleSlug, 'index.html');
    try {
      const html = await fs.readFile(filePath, 'utf-8');
      posts.push({ slug: singleSlug, filePath, html });
    } catch {
      console.error(`Post not found: ${singleSlug}`);
    }
    return posts;
  }

  // Find all index.html files in subdirectories
  const pattern = path.join(config.crawledSitePath, '*/index.html').replace(/\\/g, '/');
  const files = await glob(pattern);

  for (const filePath of files) {
    const dir = path.dirname(filePath);
    const slug = path.basename(dir);

    // Skip excluded directories
    if (excludedDirectories.includes(slug)) {
      continue;
    }

    // Skip if it looks like an archive page (check for multiple article elements)
    const html = await fs.readFile(filePath, 'utf-8');

    // Quick check: blog posts have entry-content class
    if (!html.includes('entry-content')) {
      continue;
    }

    // Skip archive/listing pages (they have multiple articles)
    const articleCount = (html.match(/<article/g) || []).length;
    if (articleCount > 1) {
      continue;
    }

    // Skip WordPress pages (only include posts)
    // Pages have body class containing "page page-id" or "page-template"
    // Posts have body class containing "single-post" or "post-template-default single single-post"
    const bodyClassMatch = html.match(/<body[^>]*class="([^"]+)"/);
    if (bodyClassMatch) {
      const bodyClass = bodyClassMatch[1];
      // Skip if it's a page (not a post)
      if (bodyClass.includes('page ') || bodyClass.includes('page-id-')) {
        continue;
      }
      // Must be a single post
      if (!bodyClass.includes('single-post') && !bodyClass.includes('single ')) {
        continue;
      }
    }

    posts.push({ slug, filePath, html });
  }

  return posts;
}

/**
 * Process a single post
 */
async function processPost(
  post: LegacyPost,
  dryRun: boolean
): Promise<{ success: boolean; processed?: ProcessedPost; error?: string }> {
  try {
    // Parse metadata from HTML
    const parsed = parsePost(post);

    // Extract images from content
    const images = extractImages(parsed.htmlContent, parsed.slug);

    // Also check for featured image
    if (parsed.image) {
      const featuredImages = extractImages(`src="${parsed.image}"`, parsed.slug);
      images.push(...featuredImages);
    }

    // Process images
    if (!dryRun) {
      await processPostImages(images, dryRun);
    }

    // Convert HTML to Markdown
    const markdownContent = htmlToMarkdown(parsed.htmlContent);

    const processed: ProcessedPost = {
      ...parsed,
      markdownContent,
      images,
    };

    return { success: true, processed };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Generate the output filename
 */
function generateFilename(date: string, slug: string): string {
  return `${date}-${slug}.md`;
}

/**
 * Write a processed post to disk
 */
async function writePost(post: ProcessedPost, dryRun: boolean): Promise<void> {
  const filename = generateFilename(post.date, post.slug);
  const outputPath = path.join(config.blogOutputPath, filename);

  const frontmatter = generateFrontmatter({
    title: post.title,
    date: post.date,
    author: post.author,
    category: post.category,
    tags: post.tags,
    image: post.image,
    excerpt: post.excerpt,
  });

  const content = `${frontmatter}\n\n${post.markdownContent}\n`;

  if (dryRun) {
    console.log(`[DRY RUN] Would write: ${outputPath}`);
    console.log(`  Title: ${post.title}`);
    console.log(`  Date: ${post.date}`);
    console.log(`  Category: ${post.category}`);
    console.log(`  Images: ${post.images.filter((i) => !i.isThumbnail).length}`);
    return;
  }

  await fs.mkdir(config.blogOutputPath, { recursive: true });
  await fs.writeFile(outputPath, content, 'utf-8');
}

/**
 * Main migration function
 */
async function migrate(): Promise<void> {
  console.log('='.repeat(60));
  console.log('EsteBike Blog Migration');
  console.log('='.repeat(60));

  const { dryRun, force, slug } = parseArgs();

  if (dryRun) {
    console.log('\n[DRY RUN MODE - No files will be written]\n');
  }

  if (force) {
    console.log('[FORCE MODE - Existing posts will be overwritten]\n');
  }

  if (slug) {
    console.log(`Processing single post: ${slug}\n`);
  }

  // Initialize report
  const report: MigrationReport = {
    totalPosts: 0,
    successCount: 0,
    skippedCount: 0,
    failedCount: 0,
    failures: [],
    images: {
      total: 0,
      processed: 0,
      skipped: 0,
      resized: 0,
      errors: 0,
    },
    categoryWarnings: [],
  };

  // Discover posts
  console.log('Discovering posts...');
  const posts = await discoverPosts(slug);
  report.totalPosts = posts.length;
  console.log(`Found ${posts.length} posts to migrate\n`);

  if (posts.length === 0) {
    console.log('No posts found to migrate.');
    return;
  }

  // Process each post
  let current = 0;
  for (const post of posts) {
    current++;
    process.stdout.write(`[${current}/${posts.length}] ${post.slug}... `);

    // Check if post already exists (skip unless --force)
    if (!force) {
      const parsed = parsePost(post);
      const existingFile = path.join(config.blogOutputPath, generateFilename(parsed.date, post.slug));
      try {
        await fs.access(existingFile);
        report.skippedCount++;
        console.log('SKIP (exists)');
        continue;
      } catch {
        // File doesn't exist, proceed with migration
      }
    }

    const result = await processPost(post, dryRun);

    if (result.success && result.processed) {
      // Track category mapping
      // The original category is embedded in the parsed result
      // We can check if it mapped to default
      if (result.processed.category === defaultCategory) {
        // Could add warning here if needed
      }

      // Write the post
      await writePost(result.processed, dryRun);

      // Update image stats
      report.images.total += result.processed.images.length;
      report.images.processed += result.processed.images.filter((i) => !i.isThumbnail).length;
      report.images.skipped += result.processed.images.filter((i) => i.isThumbnail).length;

      report.successCount++;
      console.log('OK');
    } else {
      report.failedCount++;
      report.failures.push({ slug: post.slug, error: result.error || 'Unknown error' });
      console.log(`FAILED: ${result.error}`);
    }
  }

  // Print report
  console.log('\n' + '='.repeat(60));
  console.log('Migration Report');
  console.log('='.repeat(60));
  console.log(`Total posts:     ${report.totalPosts}`);
  console.log(`Successful:      ${report.successCount}`);
  console.log(`Skipped (exist): ${report.skippedCount}`);
  console.log(`Failed:          ${report.failedCount}`);
  console.log();
  console.log('Images:');
  console.log(`  Total found:   ${report.images.total}`);
  console.log(`  Processed:     ${report.images.processed}`);
  console.log(`  Skipped (thumbs): ${report.images.skipped}`);
  console.log(`  Resized:       ${report.images.resized}`);

  if (report.failures.length > 0) {
    console.log('\nFailures:');
    report.failures.forEach(({ slug, error }) => {
      console.log(`  - ${slug}: ${error}`);
    });
  }

  if (dryRun) {
    console.log('\n[DRY RUN COMPLETE - No files were written]');
  } else {
    console.log(`\nBlog posts written to: ${config.blogOutputPath}`);
    console.log(`Images written to: ${config.imageOutputPath}`);
  }
}

// Run migration
migrate().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
