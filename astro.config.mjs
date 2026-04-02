import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { rehypeBaseUrl } from './src/plugins/rehype-base-url.mjs';

/** Expose the resolved base path to rehype plugins via process.env */
function exposeBase() {
  return {
    name: 'expose-base',
    hooks: {
      'astro:config:done': ({ config }) => {
        process.env.__ASTRO_BASE = config.base || '/';
      },
    },
  };
}

export default defineConfig({
  site: 'https://estebike.it',
  integrations: [exposeBase(), sitemap()],
  markdown: {
    rehypePlugins: [rehypeBaseUrl],
  },
  build: {
    inlineStylesheets: 'auto',
  },
  vite: {
    css: {
      devSourcemap: true,
    },
  },
});
