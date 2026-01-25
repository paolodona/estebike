/**
 * Configuration for blog migration
 */

import path from 'path';
import { fileURLToPath } from 'url';
import type { AstroCategory, MigrationConfig } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');

export const config: MigrationConfig = {
  crawledSitePath: path.join(projectRoot, 'crawled-site/www.estebike.it'),
  blogOutputPath: path.join(projectRoot, 'src/content/blog'),
  imageOutputPath: path.join(projectRoot, 'public/images/blog'),
  maxImageWidth: 1600,
  dryRun: false,
  singleSlug: undefined,
};

/**
 * Category mapping from legacy WordPress to Astro schema
 * Keys are lowercase for case-insensitive matching
 */
export const categoryMap: Record<string, AstroCategory> = {
  news: 'News',
  notizie: 'News',
  comunicato: 'Comunicato del direttivo',
  'comunicato del direttivo': 'Comunicato del direttivo',
  direttivo: 'Comunicato del direttivo',
  coppa: 'Coppa Colli Euganei',
  'coppa colli': 'Coppa Colli Euganei',
  'coppa colli euganei': 'Coppa Colli Euganei',
  convenzioni: 'Convenzioni',
  convenzione: 'Convenzioni',
  sponsor: 'Convenzioni',
};

/**
 * Default category when no mapping found
 */
export const defaultCategory: AstroCategory = 'News';

/**
 * Directories to exclude (archive pages, not blog posts)
 */
export const excludedDirectories = [
  '2013',
  '2014',
  '2015',
  '2016',
  '2017',
  '2018',
  'feed',
  'wp-json',
  'category',
  'tag',
  'author',
  'page',
  'wp-content',
  'wp-includes',
  'wp-admin',
  'comments',
];

/**
 * Regex pattern for WordPress thumbnail files
 * Matches filenames like image-300x200.jpg
 */
export const thumbnailPattern = /-\d+x\d+\.(jpe?g|png|gif|webp)$/i;
