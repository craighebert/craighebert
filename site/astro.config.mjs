// @ts-check
import { defineConfig } from 'astro/config';

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  // Production URL. Used for canonical links and Open Graph tags.
  site: 'https://craighebert.pages.dev',
  // Static output: every page is built to plain HTML at build time.
  output: 'static',
});
