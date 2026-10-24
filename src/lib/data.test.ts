import { describe, expect, it } from 'vitest';
import { mergeRepos, readOverrides, readSyncData, type SyncedRepo } from './data';

const repo = (overrides: Partial<SyncedRepo>): SyncedRepo => ({
  name: 'example',
  description: 'upstream description',
  stars: 0,
  language: 'Python',
  pushedAt: '2026-01-01T00:00:00Z',
  topics: [],
  url: 'https://github.com/naimul3103/example',
  ...overrides,
});

describe('mergeRepos', () => {
  it('passes unmatched repositories through unchanged', () => {
    const [result] = mergeRepos([repo({ name: 'unmatched' })], []);
    expect(result.title).toBe('unmatched');
    expect(result.hidden).toBe(false);
    expect(result.featured).toBe(false);
  });

  it('lets an override win on title and category', () => {
    const [result] = mergeRepos(
      [repo({ name: 'ml-internship' })],
      [{ match: 'ml-internship', displayTitle: 'Week 1', category: 'open-source' }],
    );
    expect(result.title).toBe('Week 1');
    expect(result.category).toBe('open-source');
  });

  it('never mutates the automation payload', () => {
    const input = [repo({ name: 'x' })];
    const snapshot = JSON.stringify(input);
    mergeRepos(input, [{ match: 'x', hidden: true }]);
    expect(JSON.stringify(input)).toBe(snapshot);
  });

  it('applies hidden and featured flags', () => {
    const results = mergeRepos(
      [repo({ name: 'a' }), repo({ name: 'b' })],
      [
        { match: 'a', hidden: true },
        { match: 'b', featured: true },
      ],
    );
    expect(results.find((r) => r.name === 'a')?.hidden).toBe(true);
    expect(results.find((r) => r.name === 'b')?.featured).toBe(true);
  });

  it('ignores overrides whose repository no longer exists', () => {
    const [result] = mergeRepos([repo({ name: 'a' })], [{ match: 'deleted', hidden: true }]);
    expect(result.hidden).toBe(false);
  });
});

describe('the committed data + overrides', () => {
  const { repos } = readSyncData();
  const overrides = readOverrides();
  const merged = mergeRepos(repos, overrides);

  it('has a snapshot with repositories', () => {
    expect(repos.length).toBeGreaterThan(5);
  });

  it('keeps the case-study repos visible', () => {
    for (const name of ['diabetes-prediction-system', 'skill-tracker-api', 'cryptomaster']) {
      expect(merged.find((repo) => repo.name === name)?.hidden, name).not.toBe(true);
    }
  });

  it('hides coursework noise and the profile repo', () => {
    for (const name of ['flower_shop_as1', 'Naimul-Islam1', 'C_programming']) {
      expect(merged.find((repo) => repo.name === name)?.hidden, name).toBe(true);
    }
  });

  it('survives a simulated automation refresh without clobbering overrides', () => {
    // A refresh re-sends upstream values for the same repositories; the owner
    // layer must still win. This is the invariant the sync job depends on.
    const refreshed = repos.map((repo) => ({
      ...repo,
      description: 'refreshed by automation',
      title: 'should be ignored',
    })) as unknown as SyncedRepo[];

    const after = mergeRepos(refreshed, overrides);
    const skillTracker = after.find((repo) => repo.name === 'skill-tracker-api');
    expect(skillTracker?.title).toBe('Developer Skill Tracker API');
    expect(skillTracker?.featured).toBe(true);
  });
});
