import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * The content contract. Collections live in ./content (not src/content) because
 * content is the database and the database is not application source.
 *
 * `.strict()` everywhere: an unknown frontmatter field fails the build instead
 * of silently rendering a hole. Every rule here mirrors docs/CONTENT-MODEL.md.
 */

const optionalCover = {
  cover: z.string().optional(),
  coverAlt: z.string().optional(),
};

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/projects' }),
  schema: z
    .object({
      title: z.string().max(110),
      description: z.string().max(180),
      pubDate: z.coerce.date(),
      updated: z.coerce.date().optional(),
      category: z.enum(['personal', 'university', 'open-source']),
      stack: z.array(z.string()).min(1),
      status: z.enum(['live', 'wip', 'archived']),
      order: z.number().optional(),
      ...optionalCover,
      repoUrl: z.string().url().optional(),
      demoUrl: z.string().url().optional(),
      docsUrl: z.string().url().optional(),
      outcomes: z
        .array(
          z.object({
            claim: z.string().min(1),
            metric: z.string().min(1),
            method: z.string().min(1),
          }),
        )
        .min(1),
      evidence: z.array(z.string().url()).default([]),
      whatIdDoDifferently: z.string().min(80),
    })
    .strict()
    .refine((v) => v.cover || v.repoUrl || v.demoUrl, {
      message: 'one of cover, repoUrl or demoUrl is required',
    })
    .refine((v) => !v.cover || v.coverAlt, { message: 'coverAlt is required with cover' }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './content/blog' }),
  schema: z
    .object({
      title: z.string().max(110),
      description: z.string().max(180),
      pubDate: z.coerce.date(),
      updated: z.coerce.date().optional(),
      tags: z.array(z.string()).default([]),
      category: z.enum(['technical', 'learning-journey', 'book-review', 'notes']),
      draft: z.boolean().default(false),
      ...optionalCover,
      aiGenerated: z.boolean().default(false),
      comments: z.enum(['on', 'off']).default('on'),
    })
    .strict()
    .refine((v) => !v.cover || v.coverAlt, { message: 'coverAlt is required with cover' }),
});

const notes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/notes' }),
  schema: z
    .object({
      title: z.string().max(110),
      description: z.string().max(220),
      pubDate: z.coerce.date(),
      updated: z.coerce.date().optional(),
      status: z.enum(['seedling', 'growing', 'evergreen']),
      tags: z.array(z.string()).min(1),
      draft: z.boolean().default(false),
    })
    .strict(),
});

const photos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/photos' }),
  schema: z
    .object({
      title: z.string(),
      date: z.coerce.date(),
      image: z.string(),
      alt: z.string().min(10),
      collection: z.enum(['travel', 'nature', 'urban', 'other']),
      exif: z
        .object({
          camera: z.string().optional(),
          lens: z.string().optional(),
          settings: z.string().optional(),
        })
        .optional(),
      location: z.string().optional(),
      draft: z.boolean().default(false),
    })
    .strict(),
});

export const collections = { projects, blog, notes, photos };
