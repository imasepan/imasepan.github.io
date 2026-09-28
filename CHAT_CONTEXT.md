# Chat Context

- Repository: `imasepan/imasepan.github.io`
- Site type: Astro static personal portfolio and blog.
- Page routes: `src/pages/`; shared overlay shell: `src/layouts/SiteLayout.astro`.
- English home: `src/pages/index.astro`; Korean home: `src/pages/kr.html.astro`.
- Blog: `_posts/`, loaded through `src/content.config.ts`; dated URLs are preserved.
- Styling and browser behavior: `public/styles.css`, `public/overlay.css`, `public/script.js`, `public/overlay.js`.
- The Korean page uses `public/legacy-script.js`.
- Images: `public/assets/`, served at `/assets/`.
- GitHub Pages deployment: `.github/workflows/deploy.yml` builds Astro on pushes to main.
- Keep documentation in `documentation.md` and notable changes in `CHANGELOG.md`.
- Verify shared UI on English and Korean pages; `npm test` builds and runs browser checks.
