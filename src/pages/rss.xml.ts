import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getSiteConfig } from '../lib/config';
import { getNotes, getPosts } from '../lib/posts';

/**
 * One feed for everything published: posts and notes, newest first, capped at 30.
 * The site URL comes from astro.config (PUBLIC_SITE_URL), never from a literal.
 */
export async function GET(context: APIContext) {
  const site = getSiteConfig();
  const posts = await getPosts();
  const notes = await getNotes();

  const items = [
    ...posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/blog/${post.id}/`,
      categories: post.data.tags,
    })),
    ...notes.map((note) => ({
      title: note.data.title,
      description: note.data.description,
      pubDate: note.data.pubDate,
      link: `/notes/${note.id}/`,
      categories: note.data.tags,
    })),
  ]
    .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime())
    .slice(0, 30);

  return rss({
    title: `${site.name} — writing and notes`,
    description: site.tagline,
    site: context.site ?? 'https://naimul3103.pages.dev',
    items,
    customData: '<language>en</language>',
  });
}
