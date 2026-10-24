import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The résumé is one JSON Resume document; every template is a view over it.
 * Adding a template must never mean duplicating the data.
 */

export interface ResumeProfile {
  network: string;
  username?: string;
  url: string;
}

export interface ResumeBasics {
  name: string;
  label: string;
  email: string;
  url?: string;
  summary: string;
  location?: { city?: string; countryCode?: string };
  profiles: ResumeProfile[];
}

export interface ResumeProject {
  name: string;
  description: string;
  url?: string;
  highlights?: string[];
  keywords?: string[];
}

export interface ResumeEducation {
  institution: string;
  url?: string;
  area: string;
  studyType: string;
  endDate?: string;
  location?: string;
}

export interface ResumeSkill {
  name: string;
  level?: string;
  keywords: string[];
}

export interface ResumeLanguage {
  language: string;
  fluency: string;
}

export interface Resume {
  basics: ResumeBasics;
  work: {
    company: string;
    position: string;
    startDate?: string;
    endDate?: string;
    highlights?: string[];
  }[];
  education: ResumeEducation[];
  projects: ResumeProject[];
  skills: ResumeSkill[];
  languages: ResumeLanguage[];
  interests?: { name: string; keywords?: string[] }[];
}

export function getResume(): Resume {
  const path = join(process.cwd(), 'content/resume.json');
  return JSON.parse(readFileSync(path, 'utf8')) as Resume;
}

/**
 * Map a free-text fluency to the CEFR band Europass expects.
 * Deliberately conservative: "Fluent" is B2+/C1, never C2.
 */
export function fluencyToCefr(fluency: string): string {
  const value = fluency.toLowerCase();
  if (value.includes('native')) return 'C2';
  if (value.includes('full') || value.includes('fluent')) return 'C1';
  if (value.includes('professional')) return 'B2';
  if (value.includes('intermediate')) return 'B1';
  if (value.includes('basic') || value.includes('elementary')) return 'A2';
  return 'B1';
}

/** The Europass self-assessment strip: five levels, one filled. */
export function cefrLevel(fluency: string): number {
  const order = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  return order.indexOf(fluencyToCefr(fluency)) + 1;
}

export function contactLine(resume: Resume): string {
  const { basics } = resume;
  return [basics.location?.city, basics.location?.countryCode, basics.email, basics.url]
    .filter(Boolean)
    .join(' · ');
}
