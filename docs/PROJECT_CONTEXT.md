# Project context

**Recorded:** 2026-08-05
**Repository:** `imasepan/imasepan.github.io`
**Published site:** https://imasepan.github.io
**Remote default branch:** `main`
**Remote baseline inspected:** `b06a91f`
**Current phase:** Studio landing page complete
**Phase 1 implementation:** Third milestone complete

## Overview

The repository contains Jin Hyun Kim’s warm personal GitHub Pages/Jekyll website, Home/Friend. Version 1 adds a separate Studio experience without removing or redesigning Home/Friend.

## Existing Home/Friend status

- English home is the deployed root experience; Korean home is `/kr/`.
- Writing is at `/blog/`, including the Dreams post at `/blog/2026/08/04/dreams/`.
- Guestbook is `/guestbook.html` and uses GitHub Discussions.
- Existing routes and behavior are protected while Studio is built.

## Implementation status

The stale nested `main` checkout remains preserved. An isolated `codex/version1-setup` worktree is based on fetched `origin/main` at `b06a91f`; all Version 1 implementation proceeds there. The root route is a static perspective selector, `/studio/` now contains the initial Version 1 landing page, and the unchanged cozy site is available at `/home/`. Shared Home/Friend navigation, Writing back-links, and the Korean-to-English switch now target `/home/` rather than the selector.

## Current priorities

1. Implement featured-project selection and the accessible glitch-strip fallbacks.
2. Complete visual, keyboard, touch, reduced-motion, and route validation for Studio and Home/Friend.
