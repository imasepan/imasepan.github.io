# TODO

## Current Phase

- [x] Read the Version 1 brief and reconcile it with the remote repository.
- [x] Create the canonical `docs/` documentation system.
- [x] Establish an isolated implementation branch/worktree from remote `main`.
- [x] Decide the least disruptive final route for the perspective selector and Home/Friend (`/` selector; `/home/` Home/Friend).

## High Priority

- [x] Build the perspective selector.
- [ ] Build `/studio/` Version 1 using real repository projects.
- [x] Preserve and verify Home/Friend routes and links.
- [ ] Implement featured-project selection for hover, keyboard, click, and controlled scroll.
- [ ] Implement the glitch strip with static and reduced-motion fallbacks.
- [ ] Validate all required desktop, tablet, mobile, accessibility, and console checks.

## Newly Discovered

- [ ] Run final rendered visual checks once a local GitHub Pages/Jekyll preview is available to the browser; this environment blocks browser access to its localhost preview.
- [ ] Enable the Studio selector option only when `/studio/` exists, so the selector never exposes a dead route.
- [ ] Repair the pre-existing syntax error in `layout.js` in a separately scoped maintenance change; it fails syntax checking on both `origin/main` and this branch.

## Medium Priority

- [ ] Optimize supplied glitch textures if included in the repository.
- [ ] Reconcile post metadata documentation with the published Dreams post.
- [x] Decide whether the cozy route should gain a stable `/home/` alias.

## Low Priority

- [ ] Improve the README with links to the canonical docs.
- [ ] Add a Studio content-editing note after the first real project data source is established.
