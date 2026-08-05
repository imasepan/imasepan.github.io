# Repository instructions

These rules apply to `imasepan/imasepan.github.io`.

## Source of truth

- The files in `docs/` are canonical project documentation.
- The remote `main` branch is the canonical implementation state.
- Re-fetch remote `main`, re-read affected files, and enumerate `_posts/` and `assets/` before implementation work.
- Read `PROJECT_CONTEXT.md`, `VERSION1.md`, `HOME.md`, `DECISIONS.md`, and `TODO.md` before proposing work.

## Product boundaries

- Version 1 is the professional Studio experience in `VERSION1.md`.
- Home/Friend remains a separate cozy experience; do not remove or redesign it.
- Do not invent projects, employers, technologies, metrics, or outcomes.

## Implementation and validation

- Prefer static GitHub Pages/Jekyll-compatible HTML, CSS, and vanilla JavaScript.
- Keep Studio data in one structured source and use semantic HTML, CSS custom properties, sharp geometry, and restrained motion.
- Preserve Korean copy, the Menu button width, and existing Home behavior.
- Validate `/`, `/studio/`, the cozy route, `/kr/`, `/guestbook.html`, `/blog/`, and a post at 1440x900, 1024x768, 768x1024, and 390x844, including keyboard, touch, reduced motion, links, and console output.

## Documentation and Git

- Before meaningful commits, update project context, decisions, TODO, and changelog; update Version 1 only for design decisions.
- Never force-push, reset destructively, or discard remote changes. Verify remote `main` before publishing.
