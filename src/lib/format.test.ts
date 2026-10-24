import { describe, expect, it } from 'vitest';
import { daysSince, formatDate, isoDate, readingTime, slugifyTag } from './format';

describe('formatDate', () => {
  it('formats an ISO date without timezone drift', () => {
    expect(formatDate(new Date('2026-04-24T00:00:00Z'))).toBe('24 Apr 2026');
    expect(formatDate(new Date('2026-12-01T23:30:00Z'))).toBe('1 Dec 2026');
  });
});

describe('isoDate', () => {
  it('emits a machine-readable date', () => {
    expect(isoDate(new Date('2026-09-21T18:36:46Z'))).toBe('2026-09-21');
  });
});

describe('slugifyTag', () => {
  it('normalises human tags to URL slugs', () => {
    expect(slugifyTag('Machine Learning')).toBe('machine-learning');
    expect(slugifyTag('Pydantic v2')).toBe('pydantic-v2');
    expect(slugifyTag('  C++  ')).toBe('c');
    expect(slugifyTag('Hugging Face Spaces')).toBe('hugging-face-spaces');
  });

  it('is stable for already-normalised input', () => {
    expect(slugifyTag('fastapi')).toBe('fastapi');
  });
});

describe('readingTime', () => {
  it('never returns zero minutes', () => {
    expect(readingTime('')).toBe(1);
    expect(readingTime('one two three')).toBe(1);
  });

  it('ignores frontmatter and code fences', () => {
    const body = `---\ntitle: x\n---\n\n${'word '.repeat(400)}\n\`\`\`\n${'code '.repeat(500)}\n\`\`\``;
    expect(readingTime(body)).toBe(2);
  });

  it('rounds up at 200 words per minute', () => {
    expect(readingTime('word '.repeat(401))).toBe(3);
  });
});

describe('daysSince', () => {
  it('counts whole days', () => {
    const now = new Date('2026-10-24T12:00:00Z');
    expect(daysSince(new Date('2026-10-24T08:00:00Z'), now)).toBe(0);
    expect(daysSince(new Date('2026-10-20T08:00:00Z'), now)).toBe(4);
  });
});
