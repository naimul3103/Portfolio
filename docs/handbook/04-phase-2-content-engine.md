# Phase 2 — Content Engine

> **Status:** NOT STARTED · **Depends on:** G1 · **Effort:** 24–30 h (3 weeks) · **Exit gate:** G2
> **Spec references:** [`11-tech-specs.md`](11-tech-specs.md) §2 (repo layout), §3 (all content schemas + full `content.config.ts`), §4 (singleton map) · Blueprint v4 Parts 3, 7, 9.4, 14.2–14.4

---

## 2.1 Objectives

Implement **git-as-database** for real: every content type in the site becomes a schema-validated collection loaded through Astro content collections, every page in the Part 3 menu becomes a route, and every visible string that is not a component label comes from a YAML singleton. This is the largest single phase because it is the site's data model — done well, P3–P6 become thin layers over these collections (search indexes them, the CMS edits them, the chatbot reads them). The phase ends with seeded, honest content so every later feature has realistic data to test against.

## 2.2 Scope

| In scope                                                                                                                                                                                     | out of scope (goes to)                             |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `src/content.config.ts` — all 6 collections + zod schemas                                                                                                                                    | CMS editing UI (P4)                                |
| Collections: **projects**, **blog** (MDX), **notes**, **books**, **anime**, **photos**                                                                                                       | Search across them (P3)                            |
| Singleton YAMLs: `pages/{home,about,projects,lab,gallery,contact}.yaml`, `navigation.yaml`, `site-config.yaml`, `seo.yaml`, `chatbot-config.yaml`, `timeline.yaml`, `project-overrides.yaml` | Resume data + templates (P5)                       |
| Routes: `/projects[/slug]`, `/blog[/slug]` (tags, pagination), `/notes[/slug]`, `/about`, `/gallery`, `/now` stub, `/404`                                                                    | AI Lab demo routes (P6)                            |
| MDX + Shiki code blocks, reading time, prose styles (45–75ch measure)                                                                                                                        | OG images / JSON-LD (P3)                           |
| Images: `astro:assets` pipeline for local, remote patterns for R2 URLs                                                                                                                       | R2 bucket itself (created P4)                      |
| Seed content: 3+ entries per collection incl. edge-case fixtures                                                                                                                             | Real full content (ongoing editorial, post-launch) |
| Schema unit tests (vitest) for derived logic (slug, dates, tag derivation)                                                                                                                   | E2E tests (P7 wires Playwright)                    |

## 2.3 Prerequisites (Entry Criteria)

G1 passed (shell + tokens + guard scripts). Schemas in tech-specs §3 reviewed and accepted — changing a schema after P4 wires the CMS is a migration, so this is the review point for field lists.

## 2.4 Task Breakdown

| ID    | Task                                                      | Details / spec ref                                                                                                                                                                                                                                                                                                                                    | Est   | Depends |
| ----- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ------- |
| P2-01 | Author `content.config.ts` with all loaders + zod schemas | Full source in tech-specs §3.10 — glob loaders per collection, strict zod (`.max()` on titles/descriptions, `z.coerce.date()`, enums, defaults). **Strict mode on:** unknown frontmatter fails the build                                                                                                                                              | 4 h   | —       |
| P2-02 | Author the 13 singleton YAML files + their zod parse      | Per tech-specs §4 map. Every singleton validated by a `src/schemas/config.ts` module; build fails on invalid config (guardrail 1 of Blueprint 14.8)                                                                                                                                                                                                   | 3 h   | P2-01   |
| P2-03 | Projects routes                                           | `/projects` (filter bar by stack/category/year — **server-rendered filters**, no island JS) + `/projects/[slug]` detail with the case-study template: overview, problem, architecture, stack, key learnings, **Outcomes with named measurement**, Evidence block, "What I'd do differently" (Blueprint 15.3 fields are schema-required, not optional) | 4 h   | P2-01   |
| P2-04 | Blog routes + MDX                                         | `/blog` paginated (10/page), `/blog/[slug]` with Shiki, reading time, `@astrojs/mdx`, tag pages `/blog/tag/[tag]`, draft flag (visible in dev, excluded from prod build)                                                                                                                                                                              | 3.5 h | P2-01   |
| P2-05 | Notes (learning log) routes                               | `/notes` + `/notes/[slug]`; status field `seedling→evergreen` badge (Blueprint 12.4); shares blog prose components                                                                                                                                                                                                                                    | 1.5 h | P2-04   |
| P2-06 | About page from singletons                                | Story (rich text), education timeline (`timeline.yaml` list editor-shaped), certifications, hobbies; **Books** (`reading-list.yaml`) and **Anime** (`anime.yaml`) render as list-tables inside Hobbies — same files the CMS will edit in P4                                                                                                           | 2.5 h | P2-02   |
| P2-07 | Gallery route                                             | `/gallery` grid from `photos` collection; lightbox component (dialog element, ESC, focus return, no-JS = plain grid); `alt` text mandatory in schema; EXIF meta line                                                                                                                                                                                  | 2.5 h | P2-01   |
| P2-08 | `/now` page stub + project-overrides merge                | `/now` renders `pages/now.yaml` + timestamp placeholder; `getProjects()` applies `project-overrides.yaml` (override wins; featured/hidden/rename) — **write the CI test proving sync data never clobbers overrides** (Blueprint 14.9.5)                                                                                                               | 2 h   | P2-02   |
| P2-09 | Prose + reading styles                                    | `.prose` class: 45–75ch max-width, `--step-0`, tabular-nums for dates/stats, blockquote/code/table styles; `text-wrap: pretty` where supported                                                                                                                                                                                                        | 1 h   | P2-04   |
| P2-10 | Images pipeline                                           | `astro:assets` `<Image>` for local content images (AVIF/WebP, widths preset); `remotePatterns` allow R2 public URL for gallery; LQIP via `blurhash`-style placeholder at build; cover images optional per schema                                                                                                                                      | 2.5 h | P2-03   |
| P2-11 | Seed content + fixtures                                   | 3+ projects (incl. one with `hidden: true` override, one long-title), 3 posts (one MDX-heavy, one draft, one 2-line post), 3 notes, 5 books (mixed statuses, one missing cover), 5 anime, 6 photos (2 landscape, 1 missing EXIF, alt text human-written). Honest, portfolio-real content — placeholders marked TODO in `backlog.md`                   | 4 h   | P2-06   |
| P2-12 | Vitest schema/derivation tests                            | Tests: slug collision, future-date handling, tag derivation, overrides merge, draft exclusion in prod (env-dependent helper), reading time                                                                                                                                                                                                            | 2.5 h | P2-08   |
| P2-13 | Add `test` + `build` CI steps                             | `vitest run` added to `ci.yml` before build; build must stay < 3 min (alert threshold note for risk R5)                                                                                                                                                                                                                                               | 1 h   | P2-12   |

## 2.5 Implementation Notes

**Loader reality check.** Astro 5's `glob()` loaders read from any repo path — collections live in `content/` (the git-as-database contract, Blueprint 9.4), _not_ in `src/content/` (Astro's legacy default). `content.config.ts` maps: `loader: glob({ pattern: '**/*.mdx', base: './content/blog' })`. The singletons are not collections; they are validated YAML imported via a tiny `src/lib/config.ts` (typed `getTheme()`, `getNavigation()`, …) so components never `import` raw YAML without validation.

**Books/anime as list-files, not per-item files.** Blueprint 12.4 deliberately shaped `reading-list.yaml` and `anime.yaml` as **list widgets** (one file, many entries) because that matches the owner's mental model ("my reading list") and gives spreadsheet-style CMS editing. Projects/blog/notes/photos stay per-file collections (long-form bodies). This split is load-bearing for P4 UX.

**Draft semantics.** `draft: true` entries: excluded from prod build, rendered in dev with a badge, and **excluded from the chatbot KB** (P6) — a draft must never leak into an AI answer. Implement via a `isProd` filter helper, tested in P2-12.

**Filters without JavaScript.** The projects filter bar uses URL params (`/projects?stack=pytorch`) re-rendered server-side at build time — for a static site that means prebuilt combination pages for the curated filter set (stack × category), with the full list as default. If the combinatorial set grows past ~40 pages, revisit in backlog (island-ize the filter then; budget permits).

**Schema = CMS form, later.** Every field added here defines a form field in P4's `config.yml`. Required-now discipline: if a field would be annoying to fill, make it optional with a sensible default — the owner's editing experience is designed by these schemas.

## 2.6 Acceptance Criteria

- [ ] All routes render seeded content at 360/768/1280; `astro check` zero errors; **strict zod** rejects a deliberately malformed entry (proven once)
- [ ] Every visible string on built pages traces to `content/` (spot-check audit: about, projects index, one post, gallery)
- [ ] Blog: pagination works; tag page renders; draft post absent from prod build, visible in dev; MDX component renders; code block Shiki-highlighted
- [ ] Project detail renders all 15.3 fields including named-measurement Outcomes (build fails if `outcomes` lacks `metric`/`method`)
- [ ] Books + anime lists render on About with mixed statuses; missing cover falls back to a styled placeholder (no broken images, ever)
- [ ] Gallery: lightbox keyboard-operable (Tab/ESC), alt text present on all photos, EXIF line renders when present
- [ ] Overrides: `featured`/`hidden`/renamed project behaves correctly; CI test proves overrides survive an automation-style data refresh
- [ ] `vitest run` green in CI; build time < 3 min recorded
- [ ] Internal links between seed pages all resolve (manual click-through of nav + footer)

## 2.7 Definition of Done (Phase)

All acceptance boxes ticked · schema tables in tech-specs §3 updated to match implementation exactly (they are the P4 CMS contract) · seed content reviewed once for typos/claims (it's resume-adjacent — Blueprint 10.8 standard applies to human content too) · `docs/components.md` updated with new components.

## 2.8 Exit Gate G2 — Content Complete

| #   | Check                                                                         | Verified by                |
| --- | ----------------------------------------------------------------------------- | -------------------------- |
| 1   | Full site map from Part 3 menu renders with seeded content                    | route checklist walk       |
| 2   | Schemas strict + tested; malformed content fails build (not silently renders) | failing-PR evidence        |
| 3   | Nothing hard-coded: strings/hex audit passes both scripts                     | CI logs                    |
| 4   | All 13 singletons exist, validated, consumed by components                    | `src/lib/config.ts` review |
| 5   | Seed content passes manual proofread + no broken images/links                 | click-through              |

## 2.9 Risks & Rollback

**Schema churn after CMS wiring** is the big one — changing a field name after P4 means touching zod, components, tests, AND the CMS config together. Treat §3 as frozen at G2; additive changes (new optional fields) are always safe, renames need a deprecation window. **Rollback:** content is data — `git revert` restores any state; a bad migration of collection shape is recoverable because every historical version of every file exists in git history (that's the point of git-as-database).

**Changelog:** _(record actuals: hours, build time, schema changes during build)_

---

_Next phase: [`05-phase-3-discovery-engagement.md`](05-phase-3-discovery-engagement.md)_
