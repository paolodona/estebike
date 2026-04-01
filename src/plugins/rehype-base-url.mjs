import { visit } from 'unist-util-visit';

/**
 * Rehype plugin that prefixes absolute-path src/href attributes in rendered
 * markdown with the Astro site base URL. This ensures blog post images and
 * links work when the site is deployed to a subdirectory (e.g. /estebike/).
 *
 * The plugin reads the base from the ASTRO_SITE_BASE environment variable,
 * which is set in astro.config.mjs via a custom integration.
 */
export function rehypeBaseUrl() {
  return (tree) => {
    // When Astro builds with --base, it sets this on process.env via our integration
    const base = (process.env.__ASTRO_BASE || '').replace(/\/$/, '');
    if (!base) return;

    visit(tree, 'element', (node) => {
      if (node.properties?.src && typeof node.properties.src === 'string' && node.properties.src.startsWith('/')) {
        node.properties.src = base + node.properties.src;
      }
      if (node.properties?.href && typeof node.properties.href === 'string' && node.properties.href.startsWith('/') && !node.properties.href.startsWith('//')) {
        node.properties.href = base + node.properties.href;
      }
    });
  };
}
