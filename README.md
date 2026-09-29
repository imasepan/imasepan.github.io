# imasepan.github.io

Personal website and blog, built with Astro and published to GitHub Pages.

Requires Node.js 22.19 or newer.

```sh
npm ci
npm run dev
npm run build
npm run preview
```

Run browser checks with `npm test`. Install Chromium first with `npx playwright install chromium`, or select an installed Chrome using `PLAYWRIGHT_CHANNEL=chrome npm test`.

Pages live in `src/pages`, the shared shell in `src/layouts/SiteLayout.astro`, and static assets in `public`. Markdown posts remain in `_posts` and retain their existing dated URLs.

The deployment workflow builds `dist` and publishes it on pushes to `main`. In the repository’s **Settings -> Pages**, select **GitHub Actions** as the deployment source.
