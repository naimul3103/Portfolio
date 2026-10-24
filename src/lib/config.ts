import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import type { z } from 'zod';
import {
  aboutPageSchema,
  animeSchema,
  blogPageSchema,
  chatbotSchema,
  contactPageSchema,
  galleryPageSchema,
  homePageSchema,
  labPageSchema,
  navigationSchema,
  nowPageSchema,
  projectsPageSchema,
  readingListSchema,
  resumeConfigSchema,
  seoSchema,
  siteConfigSchema,
  timelineSchema,
} from '../schemas/config';

/**
 * Typed accessors for the YAML singletons. Components never import YAML
 * directly: every read goes through a schema, and a malformed file throws a
 * message naming the file and the field path, at build time.
 */

const root = process.cwd();
const cache = new Map<string, unknown>();

function load<S extends z.ZodTypeAny>(file: string, schema: S): z.infer<S> {
  if (cache.has(file)) return cache.get(file) as z.infer<S>;
  const path = join(root, 'content', file);
  let raw: unknown;
  try {
    raw = parse(readFileSync(path, 'utf8'));
  } catch (error) {
    throw new Error(`[content] could not read content/${file}: ${(error as Error).message}`);
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  • ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`[content] content/${file} is invalid:\n${issues}`);
  }
  cache.set(file, result.data);
  return result.data;
}

export const getSiteConfig = () => load('site-config.yaml', siteConfigSchema);
export const getNavigation = () =>
  load('navigation.yaml', navigationSchema)
    .entries.filter((entry) => entry.visible)
    .sort((a, b) => a.order - b.order);
export const getSeo = () => load('seo.yaml', seoSchema);
export const getHomePage = () => load('pages/home.yaml', homePageSchema);
export const getAboutPage = () => load('pages/about.yaml', aboutPageSchema);
export const getProjectsPage = () => load('pages/projects.yaml', projectsPageSchema);
export const getBlogPage = () => load('pages/blog.yaml', blogPageSchema);
export const getLabPage = () => load('pages/lab.yaml', labPageSchema);
export const getGalleryPage = () => load('pages/gallery.yaml', galleryPageSchema);
export const getContactPage = () => load('pages/contact.yaml', contactPageSchema);
export const getNowPage = () => load('pages/now.yaml', nowPageSchema);
export const getTimeline = () => load('timeline.yaml', timelineSchema).entries;
export const getReadingList = () => load('reading-list.yaml', readingListSchema).books;
export const getAnime = () => load('anime.yaml', animeSchema).anime;
export const getResumeConfig = () => load('resume-config.yaml', resumeConfigSchema);
export const getChatbotConfig = () => load('chatbot-config.yaml', chatbotSchema);
