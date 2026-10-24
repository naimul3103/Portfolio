import type { CollectionEntry } from 'astro:content';
import { getCollection } from 'astro:content';
import { slugifyTag } from './format';

export type Post = CollectionEntry<'blog'>;
export type Note = CollectionEntry<'notes'>;

const isPublished = <T extends { data: object }>(entry: T): boolean =>
  import.meta.env.DEV || (entry.data as { draft?: boolean }).draft !== true;

export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('blog', isPublished);
  return posts.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

export async function getNotes(): Promise<Note[]> {
  const notes = await getCollection('notes', isPublished);
  return notes.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

export async function getPostTags(): Promise<{ label: string; slug: string; count: number }[]> {
  const posts = await getPosts();
  const counts = new Map<string, { label: string; count: number }>();
  for (const post of posts) {
    for (const tag of post.data.tags) {
      const slug = slugifyTag(tag);
      const existing = counts.get(slug);
      counts.set(slug, { label: tag, count: (existing?.count ?? 0) + 1 });
    }
  }
  return [...counts.entries()]
    .map(([slug, value]) => ({ slug, label: value.label, count: value.count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export async function getPostsByTag(tagSlug: string): Promise<Post[]> {
  const posts = await getPosts();
  return posts.filter((post) => post.data.tags.some((tag) => slugifyTag(tag) === tagSlug));
}

/** Related posts: shared tags first, newest as the tie-break. */
export async function getRelatedPosts(current: Post, limit = 2): Promise<Post[]> {
  const tags = new Set(current.data.tags.map(slugifyTag));
  const posts = await getPosts();
  return posts
    .filter((post) => post.id !== current.id)
    .map((post) => ({
      post,
      score: post.data.tags.filter((tag) => tags.has(slugifyTag(tag))).length,
    }))
    .sort(
      (a, b) => b.score - a.score || b.post.data.pubDate.getTime() - a.post.data.pubDate.getTime(),
    )
    .slice(0, limit)
    .map((item) => item.post);
}
