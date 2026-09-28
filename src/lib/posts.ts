import type { CollectionEntry } from 'astro:content';

export const postUrl = (post: CollectionEntry<'posts'>) => {
  const [year, month, day, ...slug] = post.id.split('-');
  return `/blog/${year}/${month}/${day}/${slug.join('-')}/`;
};
export const formatDate = (date: Date) => date.toLocaleDateString('en-US', {
  month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
});
export const excerpt = (post: CollectionEntry<'posts'>) => {
  const text = (post.data.description || post.data.excerpt || post.body || '')
    .replace(/!\[\[[^\]]*\]\]|!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/<[^>]*>/g, '').replace(/[#*_~>`]/g, '').trim();
  const words = text.split(/\s+/);
  return words.slice(0, 24).join(' ') + (words.length > 24 ? '…' : '');
};
