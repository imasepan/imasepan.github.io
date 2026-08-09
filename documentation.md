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

The site now shows a bounded entrance screen while critical images and fonts decode. Large visual assets use WebP versions, expensive visual effects start during idle time, and project cards render immediately before a near-viewport GitHub refresh. The unused industrial-layout resources are no longer requested by pages.

## Development notes

The site is static/Jekyll-compatible. Project cards have static fallbacks and are refreshed from GitHub near the viewport by `script.js`; the Spotify player and guestbook are external embeds/links. When editing shared navigation or layout behavior, check both English and Korean pages as well as `_layouts/default.html`.
# Progressive leaf shadow blur

The animated sunlit leaf shadow uses three directionally masked blur layers (10px, 32px, and 80px), matching the progressive blur used by the window dividers. The shared wind displacement and billowing transform remain on the leaf wrapper.
