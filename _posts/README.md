# Blog post template

You do not need Obsidian. You can publish directly from GitHub:

1. Open the `_posts` folder in the repository.
2. Choose **Add file → Create new file**.
3. Name the file using this pattern:

YYYY-MM-DD-your-post-title.md

For example: 2026-08-03-my-first-post.md

## Images

Place attachments in `public/assets` (served at `/assets`), not the generated `dist/assets` folder. Commit the attachments with the post so GitHub Pages can publish them. Set the blog thumbnail in frontmatter with a full asset path, for example `image: /assets/my-photo.webp`. Frontmatter must start on the first line of the file, without surrounding code fences.

Embed images in a post with Obsidian syntax:

```md
![[my-photo.webp]]
```

Keep a blank line between an image embed and a `[figcaption: ...]` caption so they render as separate paragraphs.

Optional width and alt text are supported:

```md
![[my-photo.webp|480]]
![[my-photo.webp|A description of the photo]]
```

---
title: Your post title
date: 2026-08-03
description: A short one-sentence preview for the blog page.
---

Write the post below the second `---` using normal Markdown:

Start writing here.

Choose **Commit changes** when you are ready. The Astro GitHub Actions workflow will build and publish it automatically. Everything in `_posts` is public once committed.
