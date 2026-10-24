import { describe, expect, it } from 'vitest';
import { cefrLevel, contactLine, fluencyToCefr, getResume } from './resume';

describe('fluencyToCefr', () => {
  it('maps fluent speakers to C1, never C2', () => {
    expect(fluencyToCefr('Fluent')).toBe('C1');
    expect(fluencyToCefr('Full professional proficiency')).toBe('C1');
  });

  it('reserves C2 for native speakers', () => {
    expect(fluencyToCefr('Native speaker')).toBe('C2');
  });

  it('maps the middle bands conservatively', () => {
    expect(fluencyToCefr('Professional working proficiency')).toBe('B2');
    expect(fluencyToCefr('Intermediate')).toBe('B1');
    expect(fluencyToCefr('Basic')).toBe('A2');
  });

  it('falls back to B1 for unknown wording', () => {
    expect(fluencyToCefr('conversational-ish')).toBe('B1');
  });
});

describe('cefrLevel', () => {
  it('returns 1-6 for the Europass strip', () => {
    expect(cefrLevel('Basic')).toBe(2);
    expect(cefrLevel('Professional working proficiency')).toBe(4);
    expect(cefrLevel('Native speaker')).toBe(6);
  });
});

describe('the committed resume', () => {
  const resume = getResume();

  it('has the identity fields the templates render', () => {
    expect(resume.basics.name).toBe('Md Naimul Islam');
    expect(resume.basics.email).toContain('@');
    expect(resume.basics.summary.length).toBeGreaterThan(80);
  });

  it('has at least three measured projects', () => {
    expect(resume.projects.length).toBeGreaterThanOrEqual(3);
    for (const project of resume.projects) {
      expect(project.highlights?.length).toBeGreaterThan(0);
    }
  });

  it('builds a contact line without empty separators', () => {
    const line = contactLine(resume);
    expect(line).not.toMatch(/·\s*·/);
    expect(line).toContain(resume.basics.email);
  });
});
