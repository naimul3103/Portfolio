import { type CollectionEntry, getCollection } from 'astro:content';
import { slugifyTag } from './format';

export type Project = CollectionEntry<'projects'>;

/**
 * The published build never ships drafts. Draft state is derived from the
 * frontmatter field rather than a separate environment switch, so a preview
 * deploy and a production deploy cannot disagree by accident.
 */
const isPublished = <T extends { data: object }>(entry: T): boolean =>
  import.meta.env.DEV || (entry.data as { draft?: boolean }).draft !== true;

export async function getProjects(): Promise<Project[]> {
  const entries = await getCollection('projects', isPublished);
  return entries.sort((a, b) => {
    const orderA = a.data.order ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.data.order ?? Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) return orderA - orderB;
    return b.data.pubDate.getTime() - a.data.pubDate.getTime();
  });
}

export async function getFeaturedProjects(limit = 3): Promise<Project[]> {
  const projects = await getProjects();
  return projects.slice(0, limit);
}

export async function getProjectStacks(
  minCount = 1,
): Promise<{ label: string; slug: string; count: number }[]> {
  const projects = await getProjects();
  const counts = new Map<string, { label: string; count: number }>();
  for (const project of projects) {
    for (const stack of project.data.stack) {
      const slug = slugifyTag(stack);
      const existing = counts.get(slug);
      counts.set(slug, { label: stack, count: (existing?.count ?? 0) + 1 });
    }
  }
  return [...counts.entries()]
    .map(([slug, value]) => ({ slug, label: value.label, count: value.count }))
    .filter((stack) => stack.count >= minCount)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export const projectPath = (project: Project) => `/projects/${project.id}`;
