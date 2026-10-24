# Architecture

> Status: implemented. The site is a static Astro build with content-as-data and
> a very small runtime surface. This document explains the shape and the reasons,
> so a future change can be judged against them.

## 1. Constraints that drove the design

| Constraint                                        | Consequence                                                 |
| ------------------------------------------------- | ----------------------------------------------------------- |
| One author, no backend to operate                 | Static output; git is the database                          |
| Recruiters read on phones, often on poor networks | HTML-first, no client framework, ≤ 60 KB JS budget          |
| The owner must edit from a phone                  | CMS that commits to git; no database admin UI               |
| Claims must be checkable                          | Schema-required `metric` + `method` on every outcome        |
| Must cost $0 at portfolio scale                   | Cloudflare Pages + static assets; no server at request time |
| Must survive a reviewer reading the source        | Small, typed modules; gates instead of conventions          |

## 2. Rendering model

```text
content/*.md ──glob──▶ content collections ──zod──▶ typed entries
content/*.yaml ──────▶ src/lib/config.ts ──zod──▶ typed singletons
                                    │
                                    ▼
                         src/pages/*.astro (build time)
                                    │
                          HTML + hashed CSS/JS
                                    ▼
                   Cloudflare Pages CDN ──▶ browser
```

Nothing renders per request. `/rss.xml` and `/sitemap-index.xml` are also
build-time artifacts. There is no server-side code in the repository today: the
contact form falls back to `mailto:`, and the planned `worker/site-api` (Phase 6)
will sit beside the static site, not inside its render path.

### Why not SSR

The site has no per-user state, no authentication for readers, and no data that
changes faster than a deploy. SSR would add a runtime, a cold-start budget, and a
failure mode in exchange for nothing a reader can see.

### Why not a client framework

Every interactive surface here is small and isolated:

| Surface                | Approach                                 | JS shipped                 |
| ---------------------- | ---------------------------------------- | -------------------------- |
| Theme toggle           | 12-line external script                  | 0.5 KB                     |
| Mobile nav             | `<details>` + CSS                        | 0                          |
| Scroll reveals         | CSS `animation-timeline` where supported | 0                          |
| Project filters        | Static stack pages, server-rendered      | 0                          |
| Résumé template switch | Radio inputs + `:has()`                  | 0.4 KB (print + URL state) |
| Gallery lightbox       | `<dialog>` + one delegated listener      | 0.4 KB                     |
| Search                 | Pagefind, lazy on `/search`              | 106 KB, not on other pages |

A framework would trade these for a hydration boundary and a bundle. The budget
in `scripts/check-size.mjs` makes that trade explicit: 3.2 KB used, 60 KB allowed.

## 3. The content contract

Two schema layers, both strict:
- `src/content.config.ts` — Astro collections (`projects`, `blog`, `notes`,
  `photos`). Loaded with `glob()` from `./content/*`, not `src/content/*`, because
  the content directory is the database and should not live inside application
  source.
- `src/schemas/config.ts` — the 13 YAML/JSON singletons (theme, navigation,
  site config, SEO, chatbot, page copy, timeline, reading list, anime, overrides,
  résumé config).

A failure in either layer throws with the file and field path before any HTML is
produced. `scripts/check-content.mjs` adds the checks a single-file schema cannot
make: navigation entries must resolve to a known route, page section ids must be
from the fixed catalogue, and every project must have at least one outcome with a
metric and a method.

## 4. The theme pipeline

```text
content/theme.yaml
      │  scripts/tokens.mjs (validates hex, required roles)
      ▼
src/styles/tokens.css   ← committed, regenerated on every build
      │  consumed as var(--token) everywhere
      ▼
components + Tailwind utilities
```

The generated file is committed so a broken generator cannot leave the site
unstyled — the last known good CSS stays in git. `scripts/check-contrast.mjs`
computes WCAG ratios for ten pairs in both palettes and fails under 4.5:1;
`scripts/check-no-hex.mjs` fails on any literal colour in `src/`.

## 5. The owner layer over automation

```text
GitHub API ──(sync job)──▶ content/data/projects.json   (automation-owned)
                                        │
content/project-overrides.yaml ─────────┼──▶ mergeRepos() ──▶ rendered lists
        (owner-owned)                   │
                                        ▼
                              override always wins
```

`mergeRepos` is a pure function (`src/lib/data.ts`) with tests that simulate a
refresh and assert the override survives. The CMS exposes `content/data` as
read-only. This is the guardrail that keeps an automated job from silently
renaming or hiding a case study.

## 6. Failure modes, by design

| Failure                             | Behaviour                                                            |
| ----------------------------------- | -------------------------------------------------------------------- |
| Content schema invalid              | Build fails, deploy blocked, previous version stays live             |
| Navigation points at a missing page | `check-content.mjs` fails before deploy                              |
| Palette fails contrast              | CI fails; the token, not the threshold, changes                      |
| A new island grows JS               | `check-size.mjs` fails above 60 KB                                   |
| A link or anchor breaks             | `check-links.mjs` fails on `dist/`                                   |
| Search index missing (dev)          | `/search` shows a server-rendered fallback, no broken widget         |
| Worker down (Phase 6)               | Contact falls back to `mailto:`; chat shows the "AI is resting" card |
| CMS saves a draft                   | It becomes a PR, not a production change                             |

## 7. Deliberate deviations from the handbook

Recorded here because the handbook is the contract, and deviations must be
visible rather than silent.

| Handbook                      | This build                                  | Reason                                                                                           |
| ----------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| pnpm ≥ 10                     | npm 11 (`package-lock.json`)                | pnpm is not installed in the target environment; npm is the fallback the handbook already allows |
| Astro 5.x pinned minor        | `5.18.2` exact                              | Current 5.x line; Astro 7 is the registry latest and is not what the spec targeted               |
| Satori for OG images          | SVG → PNG with sharp, committed             | Avoids a font dependency in CI; the card is generated from the same theme tokens                 |
| Pagination at 10/page         | Deferred until > 12 posts                   | Three posts paginated into one page is furniture, not function                                   |
| Sveltia from npm at build     | 2.5 MB bundle vendored into `public/admin/` | Keeps `/admin` CSP at `script-src 'self'`; upgrade is one command (`npm run vendor:admin`)       |
| Playwright + axe + LHCI in CI | Not yet wired                               | Documented as the next quality step; unit, content, contrast, budget and link gates are live     |

## 8. Where to change what

| Change                      | Touch                                                                            |
| --------------------------- | -------------------------------------------------------------------------------- |
| Colours, type scale, motion | `content/theme.yaml` (+ `npm run tokens`)                                        |
| Page copy                   | `content/pages/*.yaml`                                                           |
| A new project               | `content/projects/<slug>.md`                                                     |
| Navigation                  | `content/navigation.yaml` + the route must exist                                 |
| A new section type          | `schemas/config.ts`, `home.yaml`, `index.astro` — the section id is a closed set |
| A new collection            | `content.config.ts`, `src/lib/`, CMS config, `docs/CONTENT-MODEL.md`             |
| A new integration           | `docs/QUALITY.md` budget table first, then code                                  |
