# Changelog

## 2026-09-29 — Twilight 2

- Added `/twilight2/`, a separate seaside layout based on the supplied reference: open blue-hour sky, coastal lights, railing, and a reflective pedestrian crossing, without people, a streetlamp, or clouds.
- Added stronger animated sea ripples, distorted sky/coast/light reflections, and the original Twilight rocket and smoke trail at 42% scale, with a synchronized water reflection. All motion pauses with the control, reduced-motion preference, or a hidden tab.
- Added subtle water and film-grain motion with pause/resume, reduced-motion support, and a link to the original Twilight page.
- Verified the production build, desktop and mobile previews, and motion control.

## 2026-09-27 — Astro migration and falling rain

- Replaced the Jekyll configuration and Liquid layouts with Astro static pages in `src/pages` and a shared `SiteLayout.astro` shell. Migrated Home, About, Work, Guestbook, Blog, Korean Home, and Studio.
- Added an Astro content collection with validated post metadata. Kept all eight Markdown posts in `_posts`, retained their dated URLs and filename capitalization, and preserved post images, captions, excerpts, and Spotify embeds. The Korean homepage still displays the latest post.
- Preserved existing `.html` page addresses, the `/blog.html` redirect, and `/kr/`. Added a build hook that converts Astro's generated `.html` route directories into actual HTML files for static hosting.
- Moved images, stylesheets, and browser scripts into `public`, keeping their public request URLs and script execution order. Preserved overlay navigation, Close/Escape controls, browser history, retry behavior, and the persistent Spotify player.
- Added Astro configuration, TypeScript configuration, a dependency lockfile, and npm commands for development, production builds, previews, and browser tests. Documented Node.js 22.19+ as the runtime requirement.
- Added a GitHub Actions workflow to build and publish `dist` to GitHub Pages on pushes to `main`. Publishing requires selecting **GitHub Actions** as the repository's Pages source; this migration did not itself deploy the site.
- Enlarged falling rain to 4px-wide, 36–84px-long, square-ended rectangles and removed its dot/smear morphing. Left the window-droplet and rivulet generation, styling, and animation unchanged.
- Updated the README, site documentation, task context, and post-writing instructions for the Astro structure and publishing workflow.
- Verified the production build and browser checks for generated pages, all eight posts, Korean latest-post content, overlay navigation, history, captions, mobile layout, persistent weather settings, and reduced motion. Compared the window-glass generation and styling against the original source to confirm they were unchanged.


## 2026-09-27

- Reduced rain and droplet sizes by roughly a quarter; added staggered droplet slides and winding trails that extend behind their moving heads.
- Added irregular droplet silhouettes and slow water trails to the shared blurred rain background, with reduced-motion and hidden-page pauses.
- Added occasional soft dots and short smears to the existing rain in the blurred blinds background.

## 2026-08-10

- Restyled the entrance screen around the homepage's paper palette, analog dot texture, soft light, and lilac accent.
- Removed visible loading copy while preserving non-visible status labels for assistive technology.
- Matched the between-page loading transition to the same visual system.
- Applied the window-divider progressive blur bands to the animated leaf shadow.

## 2026-08-09

- Moved the homepage Spotify player left on desktop so it clears the floating language and menu controls.
- Added a short entrance screen that waits for critical images and fonts, with a three-second safety cap.
- Replaced runtime references to multi-megabyte PNG/JPEG visuals with optimized WebP assets.
- Deferred expensive visual effects and near-viewport GitHub repository refreshes until after the first render.

## 2026-08-05

- Removed the nonfunctional dynamically injected `SYSTEM`/`CLASSIC` layout button.
- Added `documentation.md` with site architecture and maintenance notes.
- Added `CHAT_CONTEXT.md` for continuity in future development chats.

## 2026-09-26

- Replaced the English scrolling homepage with Guestbook, Blog and About links over the existing window-light background.
- Added blurred page overlays, Close/Escape controls, internal reading scroll, history navigation and failed-load retry.
- Moved the persistent Spotify playlist to the bottom-left viewport corner.
- Restored animated film grain, respecting reduced-motion preferences.
- Preserved post/image content and pointer/touch captions; moved project links into About.

- Simplified the home to About, Blog, Guestbook; removed taglines, link numbers and dotted texture while retaining film grain. Added gradual backdrop and content entrance transitions.

- Added a Work overlay for GitHub projects and removed the duplicate projects and extra biography sections from About. Simplified Guestbook copy.

## 2026-09-27 — Blog layout

- Added a featured-entry layout and styled post quotations.
- Simplified the blog introduction and applied Belyga to its heading and post titles.
- Made all blog list titles equally large, scaling from 42px on mobile to 64px on desktop.
- Reverted the experimental About, Work, and Guestbook designs.
