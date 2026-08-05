# Project context

**Recorded:** 2026-08-05
**Repository:** `imasepan/imasepan.github.io`
**Published site:** https://imasepan.github.io
**Remote default branch:** `main`
**Remote baseline inspected:** `b06a91f`
**Current phase:** Isolated Version 1 implementation setup
**Phase 1 implementation:** Not started

## Overview

The repository contains Jin Hyun Kim’s warm personal GitHub Pages/Jekyll website, Home/Friend. Version 1 adds a separate Studio experience without removing or redesigning Home/Friend.

## Existing Home/Friend status

- English home is the deployed root experience; Korean home is `/kr/`.
- Writing is at `/blog/`, including the Dreams post at `/blog/2026/08/04/dreams/`.
- Guestbook is `/guestbook.html` and uses GitHub Discussions.
- Existing routes and behavior are protected while Studio is built.

## Implementation status

The stale nested `main` checkout remains preserved. An isolated `codex/version1-setup` worktree is based on fetched `origin/main` at `b06a91f`; all Version 1 implementation must proceed there.

## Current priorities

1. Decide the least disruptive perspective-selector and Home/Friend route.
2. Build the selector and `/studio/` from real repository projects.
3. Implement selection and the accessible glitch-strip fallbacks.
4. Validate Studio and unchanged Home/Friend routes before publishing.
