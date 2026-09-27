# Site Documentation

## Purpose

This repository contains the personal website for imasepan, built as a Jekyll site with English and Korean pages, a blog, a guestbook link, and client-side visual interactions.

## Key files

- `index.html` — English homepage.
- `kr.html` — Korean homepage.
- `blog.html`, `blog/index.html` — writing index pages.
- `_posts/` — Markdown blog posts.
- `_layouts/` — Jekyll layouts for posts and pages.
- `entry-loader.js`, `entry-loader.css` — the bounded entrance screen and critical-image warmup.
- `script.js` — shared interactions and deferred enhancements.
- `styles.css` — shared site styling.
- `assets/` — images and favicon assets.

## Recent change

The text-free entrance screen and between-page loading transition now mirror the homepage's warm paper palette, analog dot texture, soft window light, and muted lilac accent while critical images and fonts decode. Non-visible status labels preserve loading announcements for assistive technology. Large visual assets use WebP versions, expensive visual effects start during idle time, and project cards render immediately before a near-viewport GitHub refresh. The unused industrial-layout resources are no longer requested by pages.

## Development notes

Rain mode occasionally gathers the existing blurred drops into soft dots before stretching them into short smears within the blinds' background layer. The effect pauses when the page is hidden and stays still for reduced motion.

The `.rain-glass` SVG adds monochrome droplet silhouettes and slowly moving rivulets alongside the existing rain inside `.sunlit-shadows`. It inherits the background's shadow color, opacity and blur so the water feels part of the same atmosphere. A quarter of the beads pause, creep and slide with staggered timing; rivulet heads follow winding motion paths while synchronized stroke reveals leave trails behind them. Droplets and falling rain are roughly a quarter smaller than the initial silhouette version. Both rain layers share the Rain toggle; all water motion pauses when hidden and remains still with reduced motion.

The site is static/Jekyll-compatible. Project cards have static fallbacks and are refreshed from GitHub near the viewport by `script.js`; the Spotify player and guestbook are external embeds/links. When editing shared navigation or layout behavior, check both English and Korean pages as well as `_layouts/default.html`.
# Progressive leaf shadow blur

The animated sunlit leaf shadow uses three directionally masked blur layers (10px, 32px, and 80px), matching the progressive blur used by the window dividers. Each layer has a small, independently phased sway. A single low-octave SVG turbulence and displacement filter deforms the composite shadow on the leaf wrapper so the effect is calculated once rather than once per blur layer; the wrapper also carries the larger billowing transform. Reduced-motion mode disables the sway, billow, and deformation.

## Viewport overlay redesign (2026-09-26)

The English home, About, Guestbook, blog index and posts share the default Jekyll layout. The home has three links; pages load into a dialog, with Close/Escape returning home. Only the overlay content scrolls. The home is inert while a page is open; the Spotify dock remains mounted and usable at bottom left. Browser history and direct post URLs are supported, with retry controls for failed requests.

- overlay.css: viewport layout, blurred backdrop, film grain, responsive content.
- overlay.js: navigation, history, dialog state and cleanup.
- script.js: original background, themes, image embeds and caption interactions.
- legacy-script.js: retained behavior for the standalone Korean homepage.
- tests/overlays.cjs and tests/captions.cjs: Playwright interaction checks (PLAYWRIGHT_MODULE and PLAYWRIGHT_CHANNEL can select an installed runtime/browser).

The tests render the shared shell with content fixtures; they do not replace a full Jekyll production build. Posts and image assets remain unchanged. Projects are accessible inside About, and Guestbook links to the existing GitHub Discussions category.

The home now links to About, Work, Blog and Guestbook. GitHub project cards live in work.html; About contains the introduction, photographs and email link.
