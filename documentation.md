# Site Documentation

## Purpose

This repository contains the personal website for imasepan, built as a Jekyll site with English and Korean pages, a blog, a guestbook link, and client-side visual interactions.

## Key files

- `index.html` — English homepage.
- `kr.html` — Korean homepage.
- `blog.html`, `blog/index.html` — writing index pages.
- `_posts/` — Markdown blog posts.
- `_layouts/` — Jekyll layouts for posts and pages.
- `script.js` — theme, menu, repository loading, and interaction behavior.
- `layout.js` — layout initialization and industrial visual HUD.
- `styles.css`, `industrial.css` — site styling.
- `assets/` — images and favicon assets.

## Recent change

Removed the dynamically injected `SYSTEM`/`CLASSIC` layout button from `layout.js`. The button was not part of the page markup and was not a useful public control. The remaining layout initialization and visual HUD code are unchanged. The desktop music banner also reserves space for the floating language and menu controls so they do not cover the Spotify player.

## Development notes

The site is static/Jekyll-compatible. Public GitHub repositories are loaded in the browser by `script.js`; the Spotify player and guestbook are external embeds/links. When editing shared navigation or layout behavior, check both English and Korean pages as well as `_layouts/default.html`.
