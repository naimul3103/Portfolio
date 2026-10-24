# Phase 5 — Resume Builder

> **Status:** NOT STARTED · **Depends on:** G2 (templates) / G4 (CMS form) · **Effort:** 14–18 h (2 weeks) · **Exit gate:** G5
> **Spec references:** [`11-tech-specs.md`](11-tech-specs.md) §7 (resume data model, field mapping, PDF pipeline) · Blueprint v4 Part 13 (design rationale: one source, two renderers, one switch)

---

## 5.1 Objectives

Ship the three-piece separation of concerns from Blueprint 13.1: **one data file** (`content/resume.json`, JSON Resume standard), **two presentation templates** (Standard ATS-safe + Europass official layout), **one admin switch** (`content/resume-config.yaml`). A recruiter reading the page, an ATS parsing the PDF, and the chatbot answering "what's his experience?" (P6) all read the same file — version skew between artifacts becomes structurally impossible.

## 5.2 Scope

| In scope                                                                           | out of scope (goes to)                                                                 |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `content/resume.json` authored in JSON Resume schema + validator                   | Multi-resume variants (backlog: alternate `resume-*.json`)                             |
| Template A "Standard" (single column, ATS rules, print CSS)                        | Cover letters (out of product scope)                                                   |
| Template B "Europass" (JSON Resume → Europass mapper + community Typst template)   | PDF hosting on R2 (Pages asset serving is sufficient; revisit if size grows)           |
| `/resume` route: active template, optional visitor tabs, per-template PDF buttons  | Recruiter analytics on resume views (CWA page stats suffice)                           |
| PDF path 1: print CSS (`@page A4`); path 2: Typst in Actions (committed artifacts) | Path 3 `@react-pdf/renderer` (rejected for now — Blueprint 13.6 trade-off; reversible) |
| `resume-config.yaml` switch + CMS "Resume" collection (form, not raw JSON)         | Europass XML export via official REST (backlog — mapper covers rendering need)         |

## 5.3 Prerequisites (Entry Criteria)

G2 passed; G4 strongly preferred (the CMS Resume form is part of the deliverable — if P5 runs before P4 completes, author the JSON by hand and wire the form later; templates do not depend on the CMS). Real resume content drafted (the owner writes this once; ~2 h of actual content work is inside the estimate).

## 5.4 Task Breakdown

| ID    | Task                                         | Details / spec ref                                                                                                                                                                                                                                                                                                                                                           | Est   | Depends |
| ----- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ------- |
| P5-01 | Author + validate `content/resume.json`      | JSON Resume schema (tech-specs §7.1 subset: basics, work, education, skills, projects, certificates, languages, interests). Validate with the ecosystem's schema validator in CI (a `npx` step); content honest and complete — this file feeds hiring decisions                                                                                                              | 2.5 h | —       |
| P5-02 | Type the resume data layer                   | `src/lib/resume.ts`: typed import + derived views (grouped skills, date formatting `2023-06 → Jun 2023`, duration math); unit tests for date/duration logic                                                                                                                                                                                                                  | 2 h   | P5-01   |
| P5-03 | Template A — Standard (ATS-safe)             | Rules frozen (Blueprint 13.3): single column; **no tables/columns/graphics**; standard section headers (Summary/Skills/Experience/Projects/Education/Certifications); unambiguous dates; plain-text contacts; top third = name + role + strongest proof. Print stylesheet `@page { size: A4; margin: 18mm }` → "Download PDF" = `window.print()` (path 1, ships immediately) | 3.5 h | P5-02   |
| P5-04 | JSON Resume → Europass mapper                | Pure function `toEuropass(resume)` → Europass (Candidate) shape per tech-specs §7.2 mapping table (basics→identification, work→WorkExperience, education, languages→CEFR self-assessment, skills→competencies). Unit-tested against a fixture with edge cases (missing endDate, single language)                                                                             | 2.5 h | P5-02   |
| P5-05 | Template B — Europass via Typst              | Adopt the community Typst template implementing the official EU two-column layout (24 EU languages — Blueprint 13.4); wire mapper output → template data; honors `resume-config.yaml` europass options (`language`, `photo`, `birth_date`)                                                                                                                                   | 3 h   | P5-04   |
| P5-06 | `resume-config.yaml` + `/resume` route logic | Switch schema per Blueprint 13.5: `templates.standard/europass` (enabled), `active`, `allow_visitor_toggle`, `europass.{language,photo,birth_date}`. Route renders `active`; if both enabled + toggle → tabs; per-template PDF buttons shown per enabled template                                                                                                            | 1.5 h | P5-03   |
| P5-07 | PDF path 2: Typst in Actions                 | `resume-pdf.yml` workflow (tech-specs §9.3): on resume/config file change → `setup-typst` → compile both enabled templates → commit artifacts to `public/resume/` (`Name-Role-Resume.pdf`, `Name-Europass-CV.pdf`) via draft PR (Blueprint 10.8 — even artifact commits reviewed; deterministic output for recruiters)                                                       | 2.5 h | P5-05   |
| P5-08 | ATS smoke test                               | Mechanical: extract text from both PDFs (`pdftotext` or pdf-parse) → verify name/email/skills keywords present in reading order → single-column parse sanity. Record result; the Europass two-column parse degradation is **expected and documented** (13.4 honest note) — Standard is the ATS artifact                                                                      | 1.5 h | P5-07   |
| P5-09 | CMS wiring + owner guide update              | Resume + Resume Settings collections (already sketched in `config.yml` from P4 — now populated with real fields); owner guide gets "update your resume" + "switch template" sections                                                                                                                                                                                         | 1.5 h | P5-06   |
| P5-10 | `/resume` SEO + JSON-LD                      | Title pattern "Hire Name — Resume (PDF)"; Person JSON-LD on the page now links `resume.json` skills (closes the loop from P3-04)                                                                                                                                                                                                                                             | 1 h   | P5-06   |

## 5.5 Implementation Notes

**Mapper is the only place the two formats meet.** Templates A and B never import each other's logic; `resume.ts` + `toEuropass()` are the whole translation layer. If the Europass schema drifts (rare), the failing unit test tells you exactly which row of the §7.2 mapping table changed — the drift is visible in CI, per Blueprint 13.2's reasoning.

**ATS rules are code-review rules.** Template A's constraints are checklist items in the PR template (no `<table>` in resume components; icons via text, not glyph fonts; dates machine-readable). The moment someone "just adds a two-column layout" to the Standard template, the ATS smoke test's reading-order assertion should fail — make sure it actually asserts order, not just presence.

**PDF artifacts are committed, not generated on demand.** Static-first: recruiters get prebuilt, byte-identical PDFs (Blueprint 13.6's determinism argument). The Actions job only runs when `content/resume.json` or `resume-config.yaml` changes (paths filter) — a normal content PR costs nothing extra.

**Filename convention is part of the product.** `Name-Role-Resume.pdf` and `Name-Europass-CV.pdf` are what a recruiter sees in their downloads folder and email attachments — human-readable, sortable, no `resume-v3-final.pdf`. Enforce the naming in the workflow, not by hand.

## 5.6 Acceptance Criteria

- [ ] `resume.json` passes JSON Resume schema validation in CI; a malformed fixture fails the build (proven once)
- [ ] `/resume` renders the `active` template from `resume.json` alone — changing the name in JSON changes both templates after one rebuild
- [ ] Template A: all ATS rules hold (grep: no `<table>` in Standard components; text extraction yields correct section order); **print-to-PDF produces ≤ 2 pages**, selectable text, < 300 KB
- [ ] Template B: renders official EU two-column layout with CEFR language grid; respects `photo`/`birth_date` toggles; `language: en` renders English layout (spot-check one other EU language renders, since template supports 24)
- [ ] Visitor toggle: both templates enabled → tabs on `/resume`; `active: standard` + toggle off → visitors see exactly Standard (admin-defined, Blueprint 13.5)
- [ ] Typst workflow: a resume edit PR shows PDF diff in the PR (before/after artifacts); artifacts committed under `public/resume/` with the naming convention
- [ ] ATS smoke test passes for Standard; Europass degradation documented in `docs/` (honest-guidance README section: which template for which application)
- [ ] CMS: Resume edits via form → draft PR → merge → page + PDFs + (future) chatbot KB all update from one edit

## 5.7 Definition of Done (Phase)

All acceptance boxes ticked · mapping table in tech-specs §7.2 matches the shipped mapper exactly · owner guide covers: edit resume, switch template, download-check PDF before merging (owner habit: open the artifact from the PR) · `docs/resume-guidance.md` written (Standard vs Europass — when to use which, from Blueprint 13.4's honest note).

## 5.8 Exit Gate G5 — Resume Shipped

| #   | Check                                                                | Verified by                     |
| --- | -------------------------------------------------------------------- | ------------------------------- |
| 1   | One source of truth: both templates + PDFs from single `resume.json` | name-change test                |
| 2   | ATS artifact valid (Standard PDF parse + rules)                      | smoke test output               |
| 3   | Europass layout faithful + configurable                              | visual check vs official layout |
| 4   | Admin switch works end-to-end from CMS                               | roundtrip                       |
| 5   | PDF pipeline deterministic, paths-filtered, artifact-committed       | workflow run + PR diff          |

## 5.9 Risks & Rollback

**Typst community-template drift** (upstream template changes under you): pin the template by commit SHA or vendor it into the repo (`vendor/` with license + provenance note) — vendoring is the solo-dev-friendly choice; upgrades become visible diffs. **Print-CSS browser variance:** path 1 is "ship now, good enough" and stays the fallback if path 2 breaks — the resume never becomes un-downloadable because a CI toolchain hiccuped. **Rollback:** all artifacts are git-tracked; a bad PDF is `git revert` + one pipeline run. **Scope-cut (per execution plan 1.3):** if overrun, Typst PDF automation becomes fast-follow — print CSS alone still passes G5's spirit (both templates render; PDFs exist via browser).

**Changelog:** _(record actuals: hours, Typst version pinned, ATS test output)_

---

_Next phase: [`08-phase-6-ai-automation.md`](08-phase-6-ai-automation.md)_
