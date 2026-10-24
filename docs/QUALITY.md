# Quality: gates, budgets, and what is still missing

> The bar is mechanical, not aspirational. Every gate below runs in CI on every
> pull request; a red gate blocks the merge.

## 1. Gates

| Gate                 | Command                                       | What it protects                                                      |
| -------------------- | --------------------------------------------- | --------------------------------------------------------------------- |
| Content contract     | `npm run check:content` → `check-content.mjs` | required fields, nav → route, project measurements, section catalogue |
| Theme contrast       | part of the above                             | WCAG AA for 20 colour pairs                                           |
| No hard-coded colour | part of the above                             | retheming stays a one-file operation                                  |
| Types and templates  | `npm run check`                               | prop and expression errors                                            |
| Unit tests           | `npm run test`                                | 25 tests: dates, slugs, reading time, merge rules, résumé mapping     |
| Build                | `npm run build`                               | zod validation of every entry and singleton                           |
| JS budget            | `node scripts/check-size.mjs`                 | ≤ 60 KB gzip first-party                                              |
| Internal links       | `node scripts/check-links.mjs`                | no dead links or anchors in `dist/`                                   |

## 2. Current measurements

| Metric             | Budget               | Actual                                                              | Notes                                              |
| ------------------ | -------------------- | ------------------------------------------------------------------- | -------------------------------------------------- |
| First-party JS     | ≤ 60 KB gzip         | **3.2 KB**                                                          | theme, gallery, résumé, search loader, Astro chunk |
| Lazy search bundle | not on landing pages | 105.8 KB gzip                                                       | only fetched on `/search`                          |
| Pages built        | < 3 min              | **~63 pages in 2 s** + Pagefind 0.1 s                               | local M-series laptop                              |
| Fonts              | ≤ 120 KB             | Inter Variable + JetBrains Mono Variable, subset by `unicode-range` | self-hosted via Fontsource                         |
| Colour pairs       | 20/20 pass           | dark accent 5.45:1, muted 5.71:1 on bg                              | see `npm run check:contrast`                       |
| Content entries    | —                    | 6 projects, 3 posts, 3 notes, 0 photos                              | gallery ships its empty state                      |

## 3. The gates have been seen to fail

A gate that has never failed is decoration. During this build:

| Gate             | Failure it caught                                           | Fix                                                                  |
| ---------------- | ----------------------------------------------------------- | -------------------------------------------------------------------- |
| Contrast         | `accent` on `--surface` = **4.32:1** (below 4.5)            | changed the interactive accent to `#7C74FF`, kept the brand gradient |
| No-hex           | 4 × `#000` in a CSS mask                                    | replaced with the `black` keyword                                    |
| Content contract | missing `source` on a lab demo; unquoted `:` in YAML        | fixed the content                                                    |
| Internal links   | 43 broken links (missing touch icon, wrong project slug ×2) | generated the icon, corrected the slugs                              |

That history is the evidence that the automation is real.

## 4. Accessibility checklist (WCAG 2.2 AA)

- [x] Skip link first in tab order
- [x] Landmarks: `header`, `nav`, `main`, `footer`; one `h1` per page
- [x] Visible focus ring on every interactive element
- [x] Touch targets ≥ 44×44 px
- [x] Keyboard: nav, theme toggle, gallery dialog (ESC + focus return), résumé toggle (real radios), filters (links)
- [x] `alt` required by schema on photos; decorative SVG `aria-hidden`
- [x] Contrast gated in CI for both palettes
- [x] `prefers-reduced-motion` and theme-level `motion: none`
- [x] Forms: labels, 16px inputs, described-by errors (Worker path)
- [ ] Manual screen-reader pass (VoiceOver) — pending
- [ ] axe-core run in CI — pending (Playwright not wired)

## 5. Testing strategy

| Layer        | Tool                             | Covered                                                                        |
| ------------ | -------------------------------- | ------------------------------------------------------------------------------ |
| Derivatives  | Vitest                           | date formatting, slug rules, reading time, day counts                          |
| Merge rules  | Vitest                           | override wins, hidden/featured, refresh cannot clobber, unmatched pass-through |
| Résumé       | Vitest                           | CEFR mapping, contact line, committed data sanity                              |
| Content      | zod + `check-content.mjs`        | unknown fields, missing metrics, nav integrity                                 |
| Build output | `check-links.mjs`                | internal links and anchors                                                     |
| Budget       | `check-size.mjs`                 | JS ceiling                                                                     |
| Visual       | manual screenshots at 390 / 1440 | home, projects, case study, about, post, résumé                                |

The suite is concentrated where the bugs actually are: content and build. There
is no browser test for a static page that cannot fail at runtime, and no mocked
API tests until the Worker exists.

## 6. Known gaps, in priority order

1. **Playwright + axe** — route smoke tests and zero critical a11y violations.
2. **Lighthouse CI** — encode the LCP/CLS/SEO budgets as assertions.
3. **Worker deployment** — contact endpoint, then the assistant with injection
   tests. Code is specified; nothing is deployed.
4. **giscus** — needs a public repo Discussions category; flag is `off`.
5. **Analytics + uptime** — Cloudflare Web Analytics and one uptime monitor.
6. **Photo pipeline** — `astro:assets` for local images, LQIP placeholders, and
   R2 remote patterns when the gallery is populated.
7. **Image `sizes` audit** — no content images yet, so no regression risk today.

None of these are hidden: the README status table mirrors this list.

## 7. Code review rules

- A pull request that changes a schema updates three things: the schema, the CMS
  widget, and `docs/CONTENT-MODEL.md`.
- A pull request that adds an island adds a budget line here first.
- A pull request that changes a colour runs `npm run check:contrast` and pastes
  the result.
- A pull request that adds a page adds it to the route registry in
  `scripts/check-content.mjs`.
- Commits are Conventional Commits; `main` is always deployable.
