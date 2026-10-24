#!/usr/bin/env node
/**
 * check-content.mjs — the content contract gate.
 *
 * Runs before every build. Catches the class of mistakes zod cannot see from a
 * single file: a navigation entry pointing at a page that does not exist, a
 * missing singleton, a page section list with an unknown id, a project that
 * lost its required case-study fields.
 *
 * The route registry below is intentionally explicit: adding a page is a
 * one-line change here plus the file itself, and navigation cannot silently
 * drift to a 404.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(join(root, path), 'utf8');
const yaml = (path) => {
  try {
    return parse(read(path));
  } catch (error) {
    errors.push(`${path} — invalid YAML: ${error.message}`);
    return null;
  }
};

const errors = [];

/* ── 1. Required singletons ─────────────────────────────────────────────── */
const required = [
  'content/theme.yaml',
  'content/navigation.yaml',
  'content/site-config.yaml',
  'content/seo.yaml',
  'content/chatbot-config.yaml',
  'content/timeline.yaml',
  'content/reading-list.yaml',
  'content/anime.yaml',
  'content/project-overrides.yaml',
  'content/pages/home.yaml',
  'content/pages/about.yaml',
  'content/pages/projects.yaml',
  'content/pages/blog.yaml',
  'content/pages/lab.yaml',
  'content/pages/gallery.yaml',
  'content/pages/contact.yaml',
  'content/pages/now.yaml',
  'content/resume.json',
  'content/resume-config.yaml',
];
for (const path of required) {
  if (!existsSync(join(root, path))) errors.push(`missing singleton: ${path}`);
}

/* ── 2. Route registry ──────────────────────────────────────────────────── */
const staticRoutes = new Set([
  '/',
  '/about',
  '/projects',
  '/blog',
  '/notes',
  '/gallery',
  '/lab',
  '/contact',
  '/now',
  '/resume',
  '/search',
]);

const slugs = (dir, ext) =>
  existsSync(join(root, dir))
    ? readdirSync(join(root, dir))
        .filter((f) => f.endsWith(ext))
        .map((f) => f.replace(ext, ''))
    : [];

const projectSlugs = slugs('content/projects', '.md');
const blogSlugs = slugs('content/blog', '.mdx');
const noteSlugs = slugs('content/notes', '.md');
for (const slug of projectSlugs) staticRoutes.add(`/projects/${slug}`);
for (const slug of blogSlugs) staticRoutes.add(`/blog/${slug}`);
for (const slug of noteSlugs) staticRoutes.add(`/notes/${slug}`);

const isKnownRoute = (url) => {
  if (!url?.startsWith('/')) return true; // external links are out of scope here
  const clean = url.split('#')[0].split('?')[0].replace(/\/$/, '') || '/';
  if (staticRoutes.has(clean)) return true;
  if (clean.startsWith('/blog/tag/') || clean.startsWith('/projects/stack/')) return true;
  return false;
};

/* ── 3. Navigation ──────────────────────────────────────────────────────── */
const nav = yaml('content/navigation.yaml');
if (nav) {
  const entries = nav.entries ?? [];
  if (!Array.isArray(entries) || entries.length < 3)
    errors.push('navigation.yaml needs >= 3 entries');
  for (const entry of entries) {
    if (!entry?.label || !entry?.url)
      errors.push(`navigation entry missing label/url: ${JSON.stringify(entry)}`);
    else if (!isKnownRoute(entry.url))
      errors.push(`navigation points at unknown route: ${entry.url}`);
  }
  const orders = entries.map((e) => e.order);
  if (new Set(orders).size !== orders.length)
    errors.push('navigation.yaml has duplicate order values');
}

/* ── 4. Page section ids constrained to the fixed set ───────────────────── */
const sectionCatalog = new Set([
  'hero',
  'focus',
  'work',
  'capabilities',
  'writing',
  'timeline',
  'stack',
  'cta',
  'activity',
  'recent-notes',
]);

for (const file of readdirSync(join(root, 'content/pages'))) {
  const page = yaml(`content/pages/${file}`);
  const sections = page?.sections;
  if (!sections) continue;
  for (const section of sections) {
    if (!sectionCatalog.has(section.id)) {
      errors.push(`content/pages/${file} — unknown section id "${section.id}"`);
    }
  }
}

/* ── 5. Project case-study contract (Blueprint §15.3) ───────────────────── */
for (const slug of projectSlugs) {
  const raw = read(`content/projects/${slug}.md`);
  const front = raw.split('---')[1] ?? '';
  const data = parse(front) ?? {};
  const missing = [];
  for (const field of [
    'title',
    'description',
    'pubDate',
    'category',
    'stack',
    'status',
    'outcomes',
    'whatIdDoDifferently',
  ]) {
    if (data[field] === undefined || data[field] === null || data[field] === '')
      missing.push(field);
  }
  if (missing.length) errors.push(`content/projects/${slug}.md — missing: ${missing.join(', ')}`);
  if (Array.isArray(data.outcomes)) {
    for (const [i, outcome] of data.outcomes.entries()) {
      for (const key of ['claim', 'metric', 'method']) {
        if (!outcome?.[key])
          errors.push(`content/projects/${slug}.md — outcomes[${i}].${key} is required`);
      }
    }
  }
  if (typeof data.whatIdDoDifferently === 'string' && data.whatIdDoDifferently.length < 80) {
    errors.push(
      `content/projects/${slug}.md — whatIdDoDifferently must be >= 80 characters (honesty field)`,
    );
  }
  if (!data.repoUrl && !data.demoUrl && !data.cover) {
    errors.push(`content/projects/${slug}.md — needs repoUrl, demoUrl or cover`);
  }
}

/* ── 6. Blog integrity ──────────────────────────────────────────────────── */
for (const slug of blogSlugs) {
  const raw = read(`content/blog/${slug}.mdx`);
  const front = parse(raw.split('---')[1] ?? '') ?? {};
  if (!front.title || !front.description || !front.pubDate || !front.category) {
    errors.push(`content/blog/${slug}.mdx — title, description, pubDate and category are required`);
  }
  if (front.cover && !front.coverAlt)
    errors.push(`content/blog/${slug}.mdx — coverAlt required with cover`);
}

if (errors.length > 0) {
  console.error('\n✖ content contract violations\n');
  for (const error of errors) console.error(`  • ${error}`);
  console.error(`\n${errors.length} problem(s). Fix the content, not the checker.\n`);
  process.exit(1);
}

console.log(
  `✓ content contract holds — ${projectSlugs.length} projects, ${blogSlugs.length} posts, ` +
    `${noteSlugs.length} notes, ${staticRoutes.size} routes`,
);
