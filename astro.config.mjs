// @ts-check
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

/**
 * Site URL resolution order:
 *   1. PUBLIC_SITE_URL from the environment (Pages sets this per deploy)
 *   2. the canonical production URL
 * Every absolute URL in the build (canonical, OG, RSS, sitemap) derives from it.
 */
const site = process.env.PUBLIC_SITE_URL ?? 'https://naimul3103.pages.dev';

// Astro and the Tailwind plugin resolve different Vite copies in this workspace;
// the runtime plugin is compatible, the duplicated types are not. Cast at the seam.
const tailwind = /** @type {any} */ (tailwindcss());

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
  integrations: [
    mdx(),
    sitemap({
      filter: (page) =>
        !page.includes('/admin') && !page.includes('/search') && !page.includes('/blog/tag/'),
      changefreq: 'weekly',
      lastmod: new Date(),
    }),
  ],
  vite: {
    plugins: [tailwind],
    build: {
      // Keep the first-load JS budget honest: warn early if an island grows.
      chunkSizeWarningLimit: 60,
    },
  },
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark-dimmed' },
      wrap: true,
    },
  },
});
