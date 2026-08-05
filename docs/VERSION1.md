# Version 1 — Studio specification

Version 1 is the canonical specification for a separate professional Studio experience. Home/Friend remains available and independent.

## Product and routing

Create a perspective selector at `/`, a Studio landing page at `/studio/`, and retain Home/Friend at `/home/` or its least disruptive existing route. Preserve GitHub Pages compatibility and working Home/Friend links.

## Design

Studio is a precise, quiet, typography-led archive of real work: a black canvas, bright white featured-project card, compact monochrome metadata, sharp geometry, editorial grid, left identity rail, restrained top navigation, right scroll indicator, and a slow cyan/teal/amber/orange/crimson/red glitch strip attached to the featured card.

Do not use rounded cards, text gradients, glassmorphism, large shadows, blobs, stock imagery, fake device mockups, invented projects, or invented project facts.

## Projects and interaction

Keep data in one structured source. The active project expands to a large white card showing its number, title, factual description, technology stack, and link affordance. Other real projects appear as divided horizontal rows. Hover, focus, click, touch, and controlled scroll can select a project; keyboard access and an explicit active state are required.

Use restrained 300–500ms card and 180–300ms text transitions. Reduced motion switches states without continuous animation. The decorative glitch strip must have a static fallback, never reduce contrast or flash rapidly, and remain nonessential to assistive technology.

## Responsive and accessibility requirements

Use semantic landmarks, visible focus styles, WCAG AA contrast, targets of at least 44x44 CSS pixels, `clamp()` typography, CSS custom properties, and `prefers-reduced-motion`. Validate at 1440x900, 1024x768, 768x1024, and 390x844; mobile must retain the glitch strip and stack or compact the metadata rail.
