# Blog post template

You do not need Obsidian. You can publish directly from GitHub:

1. Open the `_posts` folder in the repository.
2. Choose **Add file → Create new file**.
3. Name the file using this pattern:

YYYY-MM-DD-your-post-title.md

For example: 2026-08-03-my-first-post.md

## Images

Place attachments in `/assets`, then embed them in a post with Obsidian syntax:

```md
![[my-photo.webp]]
```

Optional width and alt text are supported:

```md
![[my-photo.webp|480]]
![[my-photo.webp|A description of the photo]]
```

---
layout: post
title: Your post title
date: 2026-08-03
description: A short one-sentence preview for the blog page.
---

Write the post below the second `---` using normal Markdown:

Start writing here.

Choose **Commit changes** when you are ready. GitHub Pages will build and publish it automatically. Everything in `_posts` is public once committed.
