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

The site is static/Jekyll-compatible. Project cards have static fallbacks and are refreshed from GitHub near the viewport by `script.js`; the Spotify player and guestbook are external embeds/links. When editing shared navigation or layout behavior, check both English and Korean pages as well as `_layouts/default.html`.
# Progressive leaf shadow blur

The animated sunlit leaf shadow uses three directionally masked blur layers (10px, 32px, and 80px), matching the progressive blur used by the window dividers. Each layer has a small, independently phased sway. A single low-octave SVG turbulence and displacement filter deforms the composite shadow on the leaf wrapper so the effect is calculated once rather than once per blur layer; the wrapper also carries the larger billowing transform. Reduced-motion mode disables the sway, billow, and deformation.
