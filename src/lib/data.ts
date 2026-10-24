import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

/**
 * The automation layer. content/data/projects.json is written by a scheduled job
 * (or a manual `npm run sync`, Phase 6); content/project-overrides.yaml is the
 * owner's layer. Merge rule, enforced by tests: the override always wins and
 * automation never writes the override file.
 */

export interface SyncedRepo {
  name: string;
  description: string;
  stars: number;
  language: string;
  pushedAt: string;
  topics: string[];
  url: string;
  fork?: boolean;
}

export interface ProjectOverride {
  match: string;
  hidden?: boolean;
  featured?: boolean;
  displayTitle?: string;
  description?: string;
  category?: 'personal' | 'university' | 'open-source';
}

export interface RepoView extends SyncedRepo {
  title: string;
  category?: string;
  featured: boolean;
  hidden: boolean;
}

const root = process.cwd();

export function readSyncData(file = 'content/data/projects.json'): {
  fetchedAt: string;
  repos: SyncedRepo[];
} {
  return JSON.parse(readFileSync(join(root, file), 'utf8')) as {
    fetchedAt: string;
    repos: SyncedRepo[];
  };
}

export function readOverrides(file = 'content/project-overrides.yaml'): ProjectOverride[] {
  const parsed = parse(readFileSync(join(root, file), 'utf8')) as {
    overrides?: ProjectOverride[];
  };
  return parsed.overrides ?? [];
}

/** Pure function: no filesystem, no clock. This is the unit under test. */
export function mergeRepos(repos: SyncedRepo[], overrides: ProjectOverride[]): RepoView[] {
  const byName = new Map(overrides.map((override) => [override.match, override]));
  return repos.map((repo) => {
    const override = byName.get(repo.name);
    return {
      ...repo,
      title: override?.displayTitle ?? repo.name,
      description: override?.description ?? repo.description,
      category: override?.category,
      featured: override?.featured ?? false,
      hidden: override?.hidden ?? false,
    };
  });
}

export function getRepoViews(): RepoView[] {
  const { repos } = readSyncData();
  return mergeRepos(repos, readOverrides());
}

export function getVisibleRepoViews(): RepoView[] {
  return getRepoViews().filter((repo) => !repo.hidden);
}

export function getSyncStamp(): string {
  return readSyncData().fetchedAt;
}
