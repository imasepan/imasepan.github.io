# Changelog

## 2026-08-05 — Studio landing page

Summary: Added the initial Version 1 Studio page at `/studio/`: a black editorial frame, identity rail, navigation, responsive featured project card, decorative static colour strip, and the repository-confirmed PlayerMarket project record.

Routing: The root selector now links to the live Studio route. Home/Friend remains independently available at `/home/`.

Validation: static HTML, JavaScript, route, focus-style, and reduced-motion checks passed. A rendered Jekyll preview and browser localhost validation remain unavailable in this environment because Ruby/Jekyll is not installed and the browser cannot connect to its local server.

## 2026-08-05 — Home/Friend route preservation

Summary: Restored the unchanged cozy English Home/Friend page at `/home/` after the root became the perspective selector.

Routing: Shared Home/Friend navigation, Writing back-links, the Korean-to-English language switch, and in-page history updates now consistently return to `/home/`. The selector remains at `/` and Studio remains unavailable pending its own milestone.

Validation: static route and asset checks passed. A rendered Jekyll preview and browser localhost validation remain unavailable in this environment because Ruby/Jekyll is not installed and the browser cannot connect to its local server.

## 2026-08-05 — Perspective selector

Summary: Replaced the root Home/Friend entry page with a static, keyboard-accessible perspective selector that follows the Version 1 black, monochrome, typographic frame.

Routing: Home/Friend is preserved at `/home/`; shared cozy-site navigation and the Guestbook now return there. The Studio option is intentionally unavailable until its real page is built.

Validation: structural route, focus-style, and reduced-motion checks passed. Rendered browser viewport checks remain pending because browser access to the local preview is blocked in this environment.

## 2026-08-05 — Isolated Version 1 implementation setup

Summary: Added the canonical documentation baseline and established the `codex/version1-setup` worktree from `origin/main` at `b06a91f`.

Behavior change: none. Home/Friend and all published site files are unchanged.
