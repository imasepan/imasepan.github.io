# Changelog

## 2026-08-05 — Perspective selector

Summary: Replaced the root Home/Friend entry page with a static, keyboard-accessible perspective selector that follows the Version 1 black, monochrome, typographic frame.

Routing: Home/Friend is preserved at `/home/`; shared cozy-site navigation and the Guestbook now return there. The Studio option is intentionally unavailable until its real page is built.

Validation: structural route, focus-style, and reduced-motion checks passed. Rendered browser viewport checks remain pending because browser access to the local preview is blocked in this environment.

## 2026-08-05 — Isolated Version 1 implementation setup

Summary: Added the canonical documentation baseline and established the `codex/version1-setup` worktree from `origin/main` at `b06a91f`.

Behavior change: none. Home/Friend and all published site files are unchanged.
