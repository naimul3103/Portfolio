# 11 — Technical Specifications

> **Portfolio Production Handbook v2.0 — the "how it is actually built" reference.** Every phase file links into this document. **Specs here beat prose everywhere:** if a phase note and this file disagree, this file wins (and the phase file gets a PR).
>
> Verified against: Astro 5 docs, Sveltia CMS docs + `sveltia-cms-auth` repo, Cloudflare Pages/Workers/R2 docs, JSON Resume schema, GitHub Actions docs — **October 2026**. Vendor tiers re-verified quarterly (runbook §13.6).

---

## §1 — Stack Matrix (pinned)

| Layer          | Pick                                              | Version policy                    | Why this one                                                                                                                                                       | Fallback                                    |
| -------------- | ------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- |
| Framework      | **Astro** (static output)                         | pin exact minor (5.x)             | Islands + zero-JS default + content collections + native integrations (rss/sitemap/mdx); the $0 stack in Blueprint 11.2 resolves its "Astro **or** Next" fork here | Next.js SSG (port cost: high)               |
| Styling        | **Tailwind CSS 4**                                | caret                             | `@tailwindcss/vite` plugin; tokens exposed as CSS vars consumed by arbitrary values (`bg-[var(--bg)]`) — design-token pipeline stays framework-agnostic            | Vanilla CSS only (all vars already exist)   |
| Language       | TypeScript (strict)                               | Astro default `strict`            | Schemas, config modules, worker code — one language everywhere                                                                                                     | —                                           |
| Runtime        | Node ≥ 22 LTS                                     | `.nvmrc` + `packageManager`       | Current LTS line; matches Pages build image                                                                                                                        | Node 24 LTS when Pages supports it natively |
| Package mgr    | **pnpm** ≥ 10                                     | pin in `packageManager`           | Fast, disk-efficient, strict about phantom deps (CI determinism)                                                                                                   | npm (lockfile swap)                         |
| Lint/format    | **Biome** ≥ 2                                     | caret                             | One tool, ~ms speed; `biome check` covers lint+format in CI                                                                                                        | ESLint+Prettier (2 tools, slower)           |
| Unit tests     | **Vitest** ≥ 3                                    | caret                             | Native TS/esm; used for schema + derivation tests (P2-12)                                                                                                          | —                                           |
| E2E / a11y     | **Playwright** + **axe-playwright**               | caret                             | Mocked-LLM chatbot contract tests (P6-05) + a11y assertions in one pass                                                                                            | —                                           |
| Search         | **Pagefind**                                      | pin exact                         | Static index, client-side queries, zero infra (Blueprint 15.7)                                                                                                     | Fuse.js                                     |
| Comments       | **giscus**                                        | pin                               | GitHub Discussions-backed; free, no tracking (Blueprint 15.7)                                                                                                      | off per post                                |
| OG images      | **satori** + **@resvg/resvg-js**                  | pin exact                         | Build-time cards; theme-token-driven                                                                                                                               | static fallback card                        |
| CMS            | **Sveltia CMS**                                   | **pin exact** (pre-1.0 — risk R3) | MIT, active, Decap-successor; editorial workflow; R2 media (Part 12.2)                                                                                             | Pages CMS / Keystatic (same config shape)   |
| CMS auth       | **sveltia-cms-auth** (Cloudflare Worker)          | pin deploy                        | Official, self-hosted, free 100k req/day                                                                                                                           | Access token sign-in (solo fallback)        |
| Hosting        | **Cloudflare Pages** (native Git integration)     | —                                 | Unlimited static bandwidth; per-PR previews without Actions minutes (P0-08 decision)                                                                               | GitHub Pages                                |
| Edge compute   | **Cloudflare Workers**                            | —                                 | Chat/contact/lab proxies; 100k req/day, 10 ms CPU                                                                                                                  | Vercel Hobby functions                      |
| LLM            | **Groq** (`llama-3.3-70b-versatile`)              | model id in env                   | 30 RPM / 1k RPD 70B + 14.4k RPD 8B instant; OpenAI-compatible seam (risk R7)                                                                                       | Cloudflare Workers AI                       |
| Email          | **Resend** free                                   | —                                 | 100/day, 3k/month — contact form only                                                                                                                              | Web3Forms                                   |
| Bot defense    | **Cloudflare Turnstile**                          | —                                 | Free, unlimited; server-verified                                                                                                                                   | hCaptcha                                    |
| Media          | **Cloudflare R2**                                 | —                                 | 10 GB, zero egress; CMS-native integration                                                                                                                         | Cloudinary                                  |
| Error tracking | **Sentry** free                                   | —                                 | 5k events/mo — Worker + client                                                                                                                                     | GlitchTip                                   |
| Uptime         | **UptimeRobot** free (personal-use ToS)           | —                                 | 50 monitors, 5-min                                                                                                                                                 | BetterStack free 10 (commercial-safe)       |
| Analytics      | **Cloudflare Web Analytics**                      | —                                 | Cookieless — no banner (Blueprint 10.7)                                                                                                                            | umami self-host                             |
| Resume PDF     | **Typst** (via `setup-typst` Action)              | pin template SHA                  | Deterministic build-time PDFs; community Europass layout                                                                                                           | print CSS (always present)                  |
| Scheduler      | **GitHub Actions** cron (public repo = unlimited) | —                                 | Draft-PR automation + heartbeat (Part 11.5)                                                                                                                        | CF Cron Triggers                            |
| Domain         | `<name>.pages.dev` → optional custom              | —                                 | $0 start; P8 decision framework                                                                                                                                    | ~$10–12/yr at-cost                          |

**Monthly cost: $0.** Every row above is free at portfolio scale, verified October 2026 (Blueprint 11.2's table is the evidence base; this matrix pins the choices).

## §2 — Repository Layout (contract)

```text
portfolio/
├── admin/                        # CMS surface (P4)
│   ├── index.html                # loads self-hosted Sveltia bundle
│   └── config.yml                # THE CMS contract — mirrors §3/§4 schemas
├── content/                      # = the database (git-as-database, Blueprint 9.4)
│   ├── projects/*.md             # collection (frontmatter schema §3.1)
│   ├── blog/*.mdx                # collection (§3.2)
│   ├── notes/*.md                # collection (§3.3)
│   ├── photos/*.md               # collection (§3.4)
│   ├── reading-list.yaml         # books — list-file (§3.5)
│   ├── anime.yaml                # list-file (§3.6)
│   ├── pages/                    # page copy singletons (§4)
│   │   ├── home.yaml  about.yaml  projects.yaml  lab.yaml
│   │   ├── gallery.yaml  contact.yaml  now.yaml
│   ├── navigation.yaml          # singleton
│   ├── site-config.yaml          # singleton (availability, flags, socials)
│   ├── seo.yaml                  # singleton (per-page overrides)
│   ├── chatbot-config.yaml       # singleton (greeting, chips, limit text, kill-switch)
│   ├── theme.yaml                # singleton (design tokens → CSS)
│   ├── timeline.yaml             # about timeline entries
│   ├── project-overrides.yaml    # owner layer over synced data (override wins)
│   ├── resume.json               # JSON Resume (P5)
│   ├── resume-config.yaml        # template switch (P5)
│   └── data/                     # automation-owned, read-only (P6)
│       ├── projects.json         # GitHub sync output
│       └── activity.json         # activity feed source
├── public/
│   ├── fonts/                    # self-hosted variable woff2 (P1-03)
│   ├── resume/                   # committed PDF artifacts (P5-07)
│   ├── favicon.svg  robots.txt
│   ├── _headers                  # security headers incl. scoped /admin block (P7)
│   └── _redirects                # (P8: apex/www + legacy links)
├── src/
│   ├── content.config.ts         # glob loaders + zod schemas (§3.10)
│   ├── schemas/config.ts         # singleton validators (§4)
│   ├── lib/
│   │   ├── config.ts             # typed getTheme()/getNavigation()/getPages()…
│   │   ├── data.ts               # automation JSON merge (overrides layer)
│   │   ├── resume.ts             # typed resume + derived views (P5-02)
│   │   └── seo.ts                # title/meta helpers (§5 quality)
│   ├── components/               # ui/ layout/ blog/ projects/ gallery/ chat/
│   ├── layouts/BaseLayout.astro
│   ├── pages/                    # routes per Part 3 menu
│   │   ├── index.astro  about.astro  now.astro  resume.astro
│   │   ├── projects/index.astro  projects/[slug].astro
│   │   ├── blog/index.astro  blog/[slug].astro  blog/tag/[tag].astro
│   │   ├── notes/index.astro  notes/[slug].astro
│   │   ├── gallery.astro  lab.astro  contact.astro  search.astro
│   │   ├── rss.xml.js  404.astro
│   │   └── api/                   # (only if Pages Functions used — prefer Workers)
│   └── styles/{tokens.css,global.css}
├── worker/                       # Cloudflare Workers (separate deploys)
│   ├── site-api/                 # chat + contact + lab (wrangler.toml, src/)
│   └── (auth worker lives in its own repo: sveltia-cms-auth)
├── scripts/                      # build-time: tokens.ts  build-kb.mjs  og.mjs
│   │                             # gates:   check-contrast.mjs  check-no-hex.mjs
├── .github/
│   ├── workflows/  ci.yml  deploy-worker.yml  resume-pdf.yml  sync.yml
│   ├── PULL_REQUEST_TEMPLATE.md  ISSUE_TEMPLATE/
│   └── CODEOWNERS
├── docs/                         # secrets.md  components.md  owner-guide.md
│   │                             # csp-log.md  a11y-notes.md  resume-guidance.md
│   │                             # launch.md  backlog links
├── backlog.md
├── astro.config.mjs              # site, integrations (rss, sitemap, mdx), image domains
├── biome.json  package.json  pnpm-lock.yaml  .nvmrc  tsconfig.json
├── wrangler.toml                 # (per-worker in worker/site-api/)
└── LICENSE  README.md  CONTRIBUTING.md
```

**Contract rules:** (1) Nothing in `src/` contains visible copy or color literals — `content/` owns copy, `theme.yaml` owns color (CI-enforced, P1-12). (2) `content/data/**` is automation-owned; humans never hand-edit it; the CMS shows it read-only. (3) `public/` is output-only (fonts + committed artifacts) — never a place for source files.

## §3 — Content Schemas (the data model)

### §3.1 `projects` (collection: `content/projects/*.md`)

| Field                 | Type     | Req | Rules / notes                                                                                                                                                  |
| --------------------- | -------- | --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`               | string   | ✅  | `.max(110)`                                                                                                                                                    |
| `description`         | string   | ✅  | `.max(180)` — card + meta description                                                                                                                          |
| `pubDate`             | date     | ✅  | `z.coerce.date()`; future dates allowed (announced work) but UI badges them                                                                                    |
| `updated`             | date     | —   | presence → BlogPosting-style `dateModified` semantics                                                                                                          |
| `category`            | enum     | ✅  | `personal \| university \| open-source \| featured` — wait: `featured` is an override concern; enum here is `personal \| university \| open-source`            |
| `stack`               | string[] | ✅  | `.min(1)`; lowercased on save (derivation tested)                                                                                                              |
| `status`              | enum     | ✅  | `live \| wip \| archived`                                                                                                                                      |
| `order`               | number   | —   | sort within category; nulls last                                                                                                                               |
| `cover`               | image    | —   | optional; `<Image>` pipeline; alt from `coverAlt` (required if cover present — zod refinement)                                                                 |
| `repoUrl` / `demoUrl` | url      | —   | at least one required (zod `.refine()`)                                                                                                                        |
| `outcomes`            | object[] | ✅  | **exactly the Blueprint 15.3 rule:** each item `{ claim: string, metric: string, method: string }` — `.min(1)`; build fails on "made it faster" without method |
| `evidence`            | string[] | —   | links: commits, README decisions, writeups                                                                                                                     |
| `whatIdDoDifferently` | string   | ✅  | the seniority marker — forced honesty field, `.min(80)` chars                                                                                                  |

### §3.2 `blog` (collection: `content/blog/*.mdx`)

| Field                | Type         | Req | Notes                                                                     |
| -------------------- | ------------ | --- | ------------------------------------------------------------------------- |
| `title`              | string       | ✅  | `.max(110)`                                                               |
| `description`        | string       | ✅  | `.max(180)` — RSS + meta + search snippet                                 |
| `pubDate`            | date         | ✅  | coerce; draft-safe                                                        |
| `updated`            | date         | —   |                                                                           |
| `tags`               | string[]     | ✅  | `.default([])`; derived tag pages                                         |
| `category`           | enum         | ✅  | `technical \| learning-journey \| book-review \| notes` (Part 3 taxonomy) |
| `draft`              | boolean      | —   | `.default(false)` — **excluded from prod build + KB + RSS** (P2 rule)     |
| `cover` / `coverAlt` | image/string | —   | refinement pair like projects                                             |
| `aiGenerated`        | boolean      | —   | `.default(false)` → 🤖 label + disclosure link (Part 10.7)                |
| `comments`           | enum         | —   | `on \| off` `.default('on')` — giscus per-post toggle                     |
| body                 | MDX          | ✅  | Shiki; prose 45–75 ch                                                     |

### §3.3 `notes` (collection: `content/notes/*.md`)

Same shape as blog minus `category`/`aiGenerated`, plus: `status: enum(seedling \| growing \| evergreen)` (Blueprint 12.4), `tags` required `.min(1)` (a note without a topic is a diary entry), body ≤ ~500 words convention (editorial, not schema).

### §3.4 `photos` (collection: `content/photos/*.md`)

| Field        | Type   | Req | Notes                                                                                |
| ------------ | ------ | --- | ------------------------------------------------------------------------------------ |
| `title`      | string | ✅  |                                                                                      |
| `date`       | date   | ✅  | EXIF capture date preferred                                                          |
| `image`      | url    | ✅  | R2 public URL (remotePatterns allowlist); LQIP placeholder at build                  |
| `alt`        | string | ✅  | `.min(10)` — human-written (a11y gate P7; model output human-reviewed per Part 10.3) |
| `collection` | enum   | ✅  | `travel \| nature \| urban \| other` (gallery filters)                               |
| `exif`       | object | —   | `{ camera, lens, settings }` all optional strings                                    |
| `location`   | string | —   | city-level only (privacy choice, documented)                                         |
| body         | md     | —   | the story; renders in lightbox                                                       |

### §3.5 `reading-list.yaml` (list-file: books)

```yaml
books:
  - title: "Designing Data-Intensive Applications"
    author: "Martin Kleppmann"
    status: "reading" # reading | finished | want-to-read
    rating: 5 # 1–5, optional
    review: "" # short, optional
    coverUrl: "" # Open Library / Google Books URL, optional
    tags: ["engineering", "architecture"]
    started: 2026-08-01 # optional
```

### §3.6 `anime.yaml` (list-file)

```yaml
anime:
  - title: "Cowboy Bebop"
    studio: "Sunrise"
    year: 1998
    status: "finished" # watching | finished | want-to-watch
    rating: 5
    thoughts: "" # one-liner, optional
```

### §3.7 `content/data/*.json` (automation-owned)

`projects.json`: `{ fetchedAt, repos: [{ name, description, stars, language, pushedAt, topics, url }] }`. `activity.json`: `{ fetchedAt, events: [{ type, repo, at, url, summary }] }`. Both **versioned in git, merged with `project-overrides.yaml` in `src/lib/data.ts`** — merge rule: _override wins; automation never writes overrides_ (Blueprint 14.2). CI test: P2-08.

### §3.8 Slug & date derivations (tested, P2-12)

Slug = filename (no auto-slug from title — deterministic, CMS-friendly). Dates stored ISO; rendered `Jun 2023` via one helper, `tabular-nums` class applied (Blueprint 15.5). Future `pubDate` renders a "scheduled" badge in dev only.

### §3.9 Fixture policy

Every collection ships 3+ fixtures incl. edge cases (long title, missing optional cover, minimal-required entry). Fixtures live in `content/` (they are the seed content) and are the test data — no separate fixtures directory to drift.

### §3.10 `src/content.config.ts` (authoritative source)

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/projects' }),
  schema: z
    .object({
      title: z.string().max(110),
      description: z.string().max(180),
      pubDate: z.coerce.date(),
      updated: z.coerce.date().optional(),
      category: z.enum(['personal', 'university', 'open-source']),
      stack: z
        .array(z.string())
        .min(1)
        .transform((a) => a.map((s) => s.toLowerCase())),
      status: z.enum(['live', 'wip', 'archived']),
      order: z.number().optional(),
      cover: z.string().optional(),
      coverAlt: z.string().optional(),
      repoUrl: z.string().url().optional(),
      demoUrl: z.string().url().optional(),
      outcomes: z
        .array(
          z.object({
            claim: z.string().min(1),
            metric: z.string().min(1), // "40% p95 latency", not "faster"
            method: z.string().min(1), // "k6, 10k req, before/after"
          }),
        )
        .min(1),
      evidence: z.array(z.string().url()).default([]),
      whatIdDoDifferently: z.string().min(80),
    })
    .strict()
    .refine((v) => v.cover || v.repoUrl || v.demoUrl, {
      message: 'cover, repoUrl, or demoUrl required',
    })
    .refine((v) => !v.cover || v.coverAlt, { message: 'coverAlt required with cover' }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './content/blog' }),
  schema: z
    .object({
      title: z.string().max(110),
      description: z.string().max(180),
      pubDate: z.coerce.date(),
      updated: z.coerce.date().optional(),
      tags: z.array(z.string()).default([]),
      category: z.enum(['technical', 'learning-journey', 'book-review', 'notes']),
      draft: z.boolean().default(false),
      cover: z.string().optional(),
      coverAlt: z.string().optional(),
      aiGenerated: z.boolean().default(false),
      comments: z.enum(['on', 'off']).default('on'),
    })
    .strict(),
});

// notes, photos: same pattern per §3.3/§3.4 (schemas as specified above)

export const collections = { projects, blog, notes, photos };
```

Books/anime/data are **not** collections — they are validated YAML/JSON loaded through `src/lib/config.ts`/`data.ts` with hand-written zod schemas mirroring §3.5–3.7 (list-file shape is the CMS widget shape, Blueprint 12.4's deliberate decision).

## §4 — Config Singletons (typed + validated)

Loaded once per build via `src/lib/config.ts`; every getter validates + types; a malformed singleton fails the build (guardrail 1, Blueprint 14.8).

| File                                                                               | Key fields (schema highlights)                                                                                                                                                                                                                  |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `theme.yaml`                                                                       | `colors.{background,surface,text,muted,accent}` (hex, 6-digit), `colors.accent_gradient[2]`, `radii.{element,card,pill}`, `spacing` (4 or 8), `type_scale` (`compact\|modular\|editorial`), `motion` (`none\|subtle\|full`), `dark_mode` (bool) |
| `navigation.yaml`                                                                  | `entries: [{ label, url, visible, order }]` — url constrained to known routes (validated against a route registry; a nav entry to a missing page fails build)                                                                                   |
| `site-config.yaml`                                                                 | `availability` (`open\|busy\|hidden`), `socials.{github,linkedin,email}`, `footer.copyright`, flags: `search, feed, comments(on\|per_post\|off), og_images, now_page` (Blueprint 15.7 gating)                                                   |
| `seo.yaml`                                                                         | `default.{title_suffix, description}`, `pages: { [route]: { title, description } }` (overrides win over patterns), `og.default_image`                                                                                                           |
| `chatbot-config.yaml`                                                              | `greeting`, `suggested_questions[3–6]`, `rate_limit_text`, `kill_switch` (bool → build flips Worker env at deploy via a CI variable)                                                                                                            |
| `pages/home.yaml`                                                                  | `hero.{headline, taglines[], cta}`; `sections: [{ id, visible, order }]` constrained to the fixed section set (reorder/toggle, never delete — Blueprint 14.6)                                                                                   |
| `pages/about.yaml` `timeline.yaml` `pages/{projects,lab,gallery,contact,now}.yaml` | story paragraphs (md string), values[], section intros, CTA copy                                                                                                                                                                                |
| `project-overrides.yaml`                                                           | `[{ match: <repo-name>, featured, hidden, displayTitle, description, category }]`                                                                                                                                                               |
| `resume-config.yaml`                                                               | per Blueprint 13.5: `templates.{standard,europass}`, `active`, `allow_visitor_toggle`, `europass.{language,photo,birth_date}`                                                                                                                   |

**Change protocol:** singleton schema changes = PR touching [schema in `schemas/config.ts`] + [this table] + [CMS widget in `admin/config.yml`] together — the triple is atomic because these are one contract seen from three sides.

---

## §5 — CMS, Authentication & Media (Sveltia) — **spec of record**

_This section incorporates the three October-2026 corrections from official docs (also called out in Phase 4): callback URL, `media_libraries` key, and R2 secret-key handling._

### §5.1 Auth flow (sequence)

```text
Browser /admin (Sveltia SPA)
  └─> GET  https://<auth>.workers.dev/auth?site=<pages-domain>     (redirect)
        └─> GitHub OAuth authorize (repo scope)
              └─> GET  https://<auth>.workers.dev/callback          ← REGISTERED CALLBACK
                    └─> token handoff → CMS uses GitHub Contents/PR API
Rules:
  • GitHub OAuth app: callback = WORKER URL + /callback   (NOT https://<site>/admin)
  • Worker env (encrypted): GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET,
    ALLOWED_DOMAINS=<name>.pages.dev   (anti-abuse: other sites can neither use the
    worker nor extract a token — official docs' stated dual purpose)
  • GITHUB_ALLOW_WORKFLOW_SCOPE: UNSET (never grant workflow mutation to a CMS)
```

Authorization is inherited from GitHub: whoever authenticates is whoever has repo write access (one person). Optional second lock (Cloudflare Access on `/admin*`) is a P4-10 decision, cut-first.

### §5.2 `admin/config.yml` (structure of record)

```yaml
backend:
  name: github
  repo: yourname/portfolio
  branch: main
  base_url: https://<auth>.workers.dev # §5.1 worker
publish_mode: editorial_workflow # every save = draft PR (Part 10.8)
site_url: https://<name>.pages.dev
locale: en

media_libraries: # modern key (plural) — Oct 2026
  cloudflare_r2:
    access_key_id: <64-hex, NON-secret, committed> # official: this one lives in config
    bucket: portfolio-media
    account_id: <account id>
    public_url: https://pub-<hash>.r2.dev # dev-grade; P8 upgrades to media.<domain>
    prefix: cms-uploads/

collections:
  # --- content collections (mirror §3 EXACTLY) ---
  - name: blog # folder collection, editor: preview
  - name: notes
  - name: projects
  - name: photos # image fields use the R2 media library
  # --- list-files (spreadsheet-style widgets) ---
  - name: reading_list # files: [{file: content/reading-list.yaml, fields: books[list]}]
  - name: anime
  # --- singletons as files-collections (§4) ---
  - name: site # theme.yaml, navigation.yaml, site-config.yaml, seo.yaml
  - name: pages # pages/*.yaml + timeline.yaml
  - name: resume # resume.json + resume-config.yaml (P5)
  # --- automation-owned, READ-ONLY (guardrail 4, Blueprint 14.8) ---
  - name: sync_data # editor: { preview: false }; fields disabled; never writable
```

**Field-for-field rule:** every widget in this file mirrors the zod schemas in §3/§4 — `required`, enum options, `min`/`max`, hints (e.g., cover URL hint: "paste from Open Library — free"). A schema change without a matching widget change is a build bug even if CI is green, because the owner experiences the schema _only_ through this file.

### §5.3 Secrets handling (official R2 contract)

| Item                                     | Where it lives                                                                                               | Where it must never live                                                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `access_key_id`                          | `admin/config.yml` (committed)                                                                               | — (non-secret by design)                                                                                                                        |
| **R2 Secret Access Key**                 | entered once in CMS UI → **browser localStorage** (official behavior); recoverable from Cloudflare dashboard | ❌ config.yml, ❌ repo, ❌ env vars in client code — official warning verbatim: "Do not write your Secret Access Key in the configuration file" |
| OAuth client secret                      | auth Worker encrypted env vars                                                                               | ❌ repo, ❌ Pages PUBLIC vars                                                                                                                   |
| Turnstile secret / Groq key / Resend key | site-api Worker encrypted env (§6)                                                                           | ❌ anywhere browser-reachable                                                                                                                   |

### §5.4 R2 bucket CORS (exact policy)

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "DELETE", "HEAD"],
    "AllowedOrigins": ["https://<name>.pages.dev"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

Required because Sveltia's SigV4 requests preflight; `DELETE` + `ETag` + wildcard headers are needed for delete/rename in the Asset Library (official docs). **Public URL ladder:** `r2.dev` now (rate-limited, dev-grade — honest label), custom `media.<domain>` at P8 (production-grade); the switch is one `public_url` edit + one CORS origin addition.

### §5.5 CSP requirements introduced by the CMS

`/admin/*` scoped block (quality-specs §2.1): `connect-src` adds `api.github.com`, `https://<auth>.workers.dev`, `https://<account>.r2.cloudflarestorage.com`, `https://pub-<hash>.r2.dev`; `script-src 'self'` holds because the Sveltia bundle is **self-hosted from npm** (P4-02), not loaded from a CDN.

## §6 — Worker API Contracts (`worker/site-api`)

### §6.1 `POST /api/chat`

| Aspect            | Contract                                                                                                                                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Request           | `{ turnstileToken: string, message: string, sessionId?: string }`                                                                                                                                                         |
| Guards (in order) | 1. `CHAT_ENABLED` else **503** `{error:"disabled"}` · 2. Turnstile `siteverify` else **403** · 3. KV `msg:<ip>:<yyyymmdd>` ≥ 10 else **429** + `chatbot-config.rate_limit_text` · 4. `message.length > 2000` else **413** |
| Flow              | fetch `${SITE_URL}/kb.json` (cache-first `caches.default`) → system prompt = config copy + KB (~8k tokens) → Groq `llama-3.3-70b-versatile` stream                                                                        |
| Success           | `200`, SSE: `data: {"delta":"…"}` … `data: {"done":true}`                                                                                                                                                                 |
| Provider down     | `200` + SSE payload `{fallback:true}` → UI renders the "AI is resting — email me" card (aria-live announces)                                                                                                              |
| Limits            | 10 msgs/IP/day (KV), input 2k chars, output cap 800 tokens, 10 ms CPU budget (proxy is cheap)                                                                                                                             |
| Env               | `GROQ_API_KEY`, `LLM_BASE_URL` (the seam, risk R7), `LLM_MODEL`, `TURNSTILE_SECRET`, `SITE_URL`, `CHAT_ENABLED`, KV: `CHAT_LIMITS`                                                                                        |
| Privacy           | logs = message **length** + hashed IP only (Part 10.1 rule 4)                                                                                                                                                             |

### §6.2 `POST /api/contact`

`{ turnstileToken, name, email, message, companyWebsite }` — `companyWebsite` is the **honeypot** (non-empty → silently 200, discard). Guards: Turnstile → KV `contact:<ip>:<day>` ≤ 3 → length caps (message ≤ 5k) → Resend send (sender = verified domain or `onboarding@resend.dev` until P8 domain). Responses: `{ok:true}` / inline field errors `422 {errors:{email:"…"}}`. State matrix per Blueprint 15.6 row 6.

### §6.3 `POST /api/lab/:demo` (`sentiment` \| `classify`)

Same guard chain (Turnstile optional here per Part 11.4 — chosen: on, same worker), KV cap 20/IP/day, Workers AI REST (`@cf/ml-…` models), returns `{ result, model, elapsedMs }` — the UI's "How this works" panel renders `model` + stack from this payload (honest-by-default).

## §7 — Resume: Data Model & Mapping

### §7.1 JSON Resume subset (source of truth: `content/resume.json`)

Adopted fields (validated by the JSON Resume schema in CI): `basics.{name,label,email,url,summary,location,profiles[]}`, `work[] {company,position,startDate,endDate?,highlights[]}`, `education[]`, `skills[] {name,keywords[]}`, `projects[]`, `certificates[]`, `languages[] {language,fluency}`, `interests[]`. Unknown fields allowed (schema permits) but unused by templates.

### §7.2 JSON Resume → Europass mapping (the whole translation layer)

| JSON Resume                 | Europass (Candidate)                                      | Transform notes                                                                                       |
| --------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `basics.name`               | `Learner.Identification.PersonName`                       | split given/family                                                                                    |
| `basics.email/url/profiles` | `Identification.Contact` (Email/Website/InstantMessaging) |                                                                                                       |
| `basics.label` + `skills`   | `SkillsPassport` headline + `SkillsPassport.Skills` nodes | label → 3-line profile block                                                                          |
| `work[]`                    | `WorkExperience[]`                                        | dates ISO; `highlights[]` → Activities bullets                                                        |
| `education[]`               | `Education[]`                                             | `studyType` → title                                                                                   |
| `languages[]`               | `LinguisticSkills.SelfAssessment`                         | `fluency: Fluent` → CEFR map: Fluent→B2+/C1, Intermediate→B1, Basic→A2 (documented, owner-adjustable) |
| `certificates[]`            | `Skills` (certificate type nodes)                         |                                                                                                       |
| —                           | `Photo`, `DrivingLicence`                                 | only emitted when `resume-config.europass.photo/birth_date` on                                        |

### §7.3 PDF pipeline

Print CSS (always): `@media print` + `@page { size: A4; margin: 18mm }`; "Download PDF" → `window.print()`. Typst (Actions, `resume-pdf.yml` §9.3): mapper output → vendored community Europass template + a Standard template (Typst twin, keeps both PDFs in one toolchain) → commit `public/resume/Name-Role-Resume.pdf` + `Name-Europass-CV.pdf` via draft PR. Fallback chain: Typst job fails → artifacts from last good run remain (static site property) → print CSS still works. ATS contract for Standard PDF: `pdftotext` extraction preserves reading order + name/email findable (P5-08 test).

## §8 — Automation Job Specs (GitHub Actions)

| Job         | Trigger                     | Behavior                                                                                                       | Output                                                                                                  |
| ----------- | --------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `sync`      | cron `0 */6 * * *` + manual | GraphQL fetch repos + events; merge with `project-overrides.yaml` (override wins); write `content/data/*.json` | **draft PR** (only if diff); `no changes` log otherwise; failure = skip, stale-data-tolerant (Part 9.5) |
| `summarize` | same run as sync (batched)  | Groq pass on changed projects → summary text into same PR                                                      | part of sync PR                                                                                         |
| `heartbeat` | cron weekly                 | refresh `/now` timestamp file                                                                                  | direct commit (the one unconditional commit — keeps Actions alive past 60-day rule, Part 11.5)          |
| `covers`    | same run as sync            | missing `coverUrl` → Open Library cover API fill                                                               | part of sync PR                                                                                         |

**Invariants:** no automation ever merges its own PR (human is the merge step, Part 10.8); automation never writes `project-overrides.yaml`, `theme.yaml`, or any singleton (its blast radius is `content/data/**` only); every job is idempotent — re-running produces the same diff.

## §9 — CI/CD Workflows (files of record)

### §9.1 `.github/workflows/ci.yml` (PR + push to main)

```yaml
name: ci
on:
  pull_request:
  push: { branches: [main] }
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4 # pinned by SHA in real file (Part 10.1)
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version-file: .nvmrc, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm biome check . # lint + format
      - run: node scripts/check-contrast.mjs # theme token gate (P1-11)
      - run: node scripts/check-no-hex.mjs # "nothing hard-coded" gate (P1-12)
      - run: pnpm exec astro check # TS + template errors
      - run: pnpm vitest run # schema + derivation tests
      - run: pnpm exec astro build # strict content validation happens here
      - run: node scripts/og.mjs # OG cards into dist/og
      - run: pnpm exec pagefind --site dist # search index (order matters, P3-01)
      - run: pnpm exec playwright test # E2E + axe (mocked LLM)
      - run: pnpm exec lhci autorun # budgets vs §3 quality-specs
      - uses: actions/upload-artifact@v4
        with: { name: dist, path: dist }
```

Deploy: **Cloudflare Pages native Git integration** builds `main` → production; every PR branch → preview URL (P0-08 decision; CI is the gate, Pages is the delivery).

### §9.2 `deploy-worker.yml` — `worker/site-api` on path change (`worker/site-api/**`), manual dispatch; `wrangler deploy` with `CLOUDFLARE_API_TOKEN` (scoped: Workers Scripts edit only). `wrangler rollback` documented in runbook.

### §9.3 `resume-pdf.yml` — paths: `content/resume.json`, `content/resume-config.yaml`, `templates/**`; `setup-typst`; compile enabled templates; commit artifacts via **draft PR**.

### §9.4 `sync.yml` — cron per §8; uses built-in `GITHUB_TOKEN` (read-only is enough for public repo GraphQL) + `GROQ_API_KEY` secret; `peter-evans/create-pull-request` (pinned SHA) for draft PRs.

## §10 — Environments & Secrets Registry

| Env                 | URL                                      | Secrets / config                                                                                                                   |
| ------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| local dev           | `http://localhost:4321`                  | none; drafts visible; `.env` for `PUBLIC_*` only (nothing secret is ever `PUBLIC_`)                                                |
| CI (GitHub Actions) | —                                        | `GROQ_API_KEY` (sync job), `CLOUDFLARE_API_TOKEN` (worker deploy, scoped)                                                          |
| Pages preview       | `https://<hash>.<name>.pages.dev`        | same build config as prod                                                                                                          |
| production          | `https://<name>.pages.dev` (+ P8 domain) | site-api Worker env: `GROQ_API_KEY, LLM_BASE_URL, LLM_MODEL, TURNSTILE_SECRET, RESEND_API_KEY, SITE_URL, CHAT_ENABLED, SENTRY_DSN` |
| auth worker         | `https://<auth>.workers.dev`             | `GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, ALLOWED_DOMAINS`                                                                          |

**Rotation (Blueprint 10.1 rule 3, calendarized in runbook §13.6):** quarterly — Groq key, R2 token, Turnstile/Resend keys, GitHub PAT; yearly — OAuth client secret rotate, `CLOUDFLARE_API_TOKEN`. Kill-switch: `CHAT_ENABLED=false` + one worker deploy = chatbot off in < 60 s.

---

_Return to: [`01-execution-plan.md`](01-execution-plan.md) · Companion spec: [`12-quality-specs.md`](12-quality-specs.md)_
