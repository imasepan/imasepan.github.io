import { defineConfig } from 'astro/config';
import { readFile, rm, writeFile } from 'node:fs/promises';

export default defineConfig({
  site: 'https://imasepan.github.io',
  output: 'static',
  integrations: [{
    name: 'preserve-html-urls',
    hooks: {
      // Astro's directory output keeps blog URLs ending in /. Flatten only the
      // legacy .html routes so static hosts serve them without a redirect.
      'astro:build:done': async ({ dir }) => {
        for (const page of ['about', 'work', 'guestbook', 'blog', 'kr', 'studio']) {
          const target = new URL(`${page}.html`, dir);
          const html = await readFile(new URL(`${page}.html/index.html`, dir));
          await rm(target, { recursive: true });
          await writeFile(target, html);
        }
      },
    },
  }],
});
