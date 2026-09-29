# Site Documentation

## Purpose

This repository contains the personal website for imasepan, built as an Astro static site with English and Korean pages, a blog, a guestbook link, and client-side visual interactions.

## Key files

- `src/pages/index.astro` — English homepage.
- `src/pages/twilight2.astro` — separate `/twilight2/` seaside composition with a clear dusk sky, distant coast, empty lookout, and wet crossing. Self-contained SVG artwork with animated sea ripples and clipped sky/coast/light reflections. The original Twilight rocket and smoke arc appear at 42% scale in the distance, with a synchronized, distorted reflection in the sea. Water, rocket, and grain motion share a reduced-motion-aware pause control and stop while the tab is hidden. The original `/twilight/` remains available.
- `src/pages/kr.html.astro` — Korean homepage.
- `src/pages/blog/index.astro` — writing index; `blog.html.astro` preserves the redirect.
- `_posts/` — Markdown blog posts.
- `src/layouts/SiteLayout.astro` — shared shell; `src/pages/blog/[...slug].astro` — posts.
- `entry-loader.js`, `entry-loader.css` — the bounded entrance screen and critical-image warmup.
- `script.js` — shared interactions and deferred enhancements.
- `styles.css` — shared site styling.
- `public/assets/` — images and favicon assets, served at `/assets/`.

## Recent change

The text-free entrance screen and between-page loading transition now mirror the homepage's warm paper palette, analog dot texture, soft window light, and muted lilac accent while critical images and fonts decode. Non-visible status labels preserve loading announcements for assistive technology. Large visual assets use WebP versions, expensive visual effects start during idle time, and project cards render immediately before a near-viewport GitHub refresh. The unused industrial-layout resources are no longer requested by pages.

## Development notes

Falling rain uses thin, square-ended rectangles, 4px wide and 36–84px long, within the blinds' background layer. The effect pauses when the page is hidden and stays still for reduced motion.

The `.rain-glass` SVG adds monochrome droplet silhouettes and slowly moving rivulets alongside the existing rain inside `.sunlit-shadows`. It inherits the background's shadow color, opacity and blur so the water feels part of the same atmosphere. A quarter of the beads pause, creep and slide with staggered timing; rivulet heads follow winding motion paths while synchronized stroke reveals leave trails behind them. Window droplets retain their existing sizes, shapes and animation. Both rain layers share the Rain toggle; all water motion pauses when hidden and remains still with reduced motion.

Astro builds the site into `dist/`. Project cards have static fallbacks and are refreshed from GitHub near the viewport by `script.js`; the Spotify player and guestbook are external embeds/links. When editing shared navigation or layout behavior, check both English and Korean pages as well as `src/layouts/SiteLayout.astro`.
# Progressive leaf shadow blur

The animated sunlit leaf shadow uses three directionally masked blur layers (10px, 32px, and 80px), matching the progressive blur used by the window dividers. Each layer has a small, independently phased sway. A single low-octave SVG turbulence and displacement filter deforms the composite shadow on the leaf wrapper so the effect is calculated once rather than once per blur layer; the wrapper also carries the larger billowing transform. Reduced-motion mode disables the sway, billow, and deformation.

## Viewport overlay redesign (2026-09-26)

The English home, About, Guestbook, blog index and posts share the shared Astro layout. The home has three links; pages load into a dialog, with Close/Escape returning home. Only the overlay content scrolls. The home is inert while a page is open; the Spotify dock remains mounted and usable at bottom left. Browser history and direct post URLs are supported, with retry controls for failed requests.

- overlay.css: viewport layout, blurred backdrop, film grain, responsive content.
- overlay.js: navigation, history, dialog state and cleanup.
- script.js: original background, themes, image embeds and caption interactions.
- legacy-script.js: retained behavior for the standalone Korean homepage.
- tests/overlays.cjs and tests/captions.cjs: Playwright interaction checks (PLAYWRIGHT_MODULE and PLAYWRIGHT_CHANNEL can select an installed runtime/browser).

The tests render the shared shell with content fixtures; they do not replace production-route coverage. Posts and image assets remain unchanged. Projects are accessible inside About, and Guestbook links to the existing GitHub Discussions category.

The home now links to About, Work, Blog and Guestbook. GitHub project cards live in `src/pages/work.html.astro`; About contains the introduction, photographs and email link.

## Blog layout (2026-09-27)

The blog keeps its featured-entry layout with a single introductory heading. Belyga is used for that heading, equally large entry titles, and individual post headings. Existing post quotations have journal styling, with responsive layouts in overlay.css. About, Work, and Guestbook retain their previous designs.

## Astro migration (2026-09-27)

Astro generates every page and Markdown post. `src/content.config.ts` validates post metadata; `_posts/README.md` is excluded from the collection. Dated post URLs preserve filename capitalization, and existing `.html` page URLs remain available. Static CSS, classic browser scripts and images live in `public/`, preserving their request URLs and script order.

Use Node 22.19+, `npm ci`, and `npm run dev`. `npm run build` creates `dist`; `npm run preview` serves it. `npm test` builds first and exercises overlay and caption interactions against the generated shell. `tests/site.cjs` verifies real generated routes and rain behavior. Set `PLAYWRIGHT_CHANNEL=chrome` to use installed Chrome.

The GitHub Actions workflow builds and publishes `dist` on pushes to `main`. Select GitHub Actions in repository Settings → Pages before deployment. No Jekyll build is required.
