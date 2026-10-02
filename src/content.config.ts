import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({
    pattern: '[0-9][0-9][0-9][0-9]-*.md',
    base: './_posts',
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string().optional(),
    excerpt: z.string().optional(),
    image: z.preprocess(value => value === null ? undefined : value, z.string().optional()),
    spotify: z.preprocess(value => value === null ? undefined : value, z.string().optional()),
  }),
});
export const collections = { posts };
