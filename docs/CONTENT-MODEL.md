# Content model

> The complete field reference for everything in `content/`. If a field is not
> here, it does not exist — schemas are strict and unknown fields fail the build.
>
> Source of truth: `src/content.config.ts` (collections) and
> `src/schemas/config.ts` (singletons). This document is the third view of the
> same contract; a schema change must update both.

## 1. Collections

### 1.1 `projects` — `content/projects/*.md`

| Field                 | Type     | Required    | Rules                                            |
| --------------------- | -------- | ----------- | ------------------------------------------------ |
| `title`               | string   | ✅          | ≤ 110 chars                                      |
| `description`         | string   | ✅          | ≤ 180 chars; card + meta description             |
| `pubDate`             | date     | ✅          | ISO; future dates allowed                        |
| `updated`             | date     | —           | renders "updated" semantics                      |
| `category`            | enum     | ✅          | `personal` \| `university` \| `open-source`      |
| `stack`               | string[] | ✅          | ≥ 1                                              |
| `status`              | enum     | ✅          | `live` \| `wip` \| `archived`                    |
| `order`               | number   | —           | sort within the index; nulls last                |
| `cover`               | string   | —           | image path/URL                                   |
| `coverAlt`            | string   | conditional | required when `cover` is set                     |
| `repoUrl`             | url      | conditional | one of cover/repo/demo required                  |
| `demoUrl`             | url      | conditional |                                                  |
| `docsUrl`             | url      | —           |                                                  |
| `outcomes`            | object[] | ✅          | ≥ 1 × `{ claim, metric, method }`, all non-empty |
| `evidence`            | url[]    | —           | commits, files, artefacts                        |
| `whatIdDoDifferently` | string   | ✅          | **≥ 80 chars** — the honesty field               |

The body is the case study: problem → what I built → results → limits.

### 1.2 `blog` — `content/blog/*.mdx`

| Field                | Type     | Required | Rules                                                         |
| -------------------- | -------- | -------- | ------------------------------------------------------------- |
| `title`              | string   | ✅       | ≤ 110                                                         |
| `description`        | string   | ✅       | ≤ 180                                                         |
| `pubDate`            | date     | ✅       |                                                               |
| `updated`            | date     | —        |                                                               |
| `tags`               | string[] | —        | default `[]`; derived tag pages                               |
| `category`           | enum     | ✅       | `technical` \| `learning-journey` \| `book-review` \| `notes` |
| `draft`              | boolean  | —        | default `false`; excluded from prod build and RSS             |
| `cover` / `coverAlt` | string   | —        | pair enforced                                                 |
| `aiGenerated`        | boolean  | —        | default `false`; adds a visible disclosure                    |
| `comments`           | enum     | —        | `on` \| `off`, default `on`                                   |

### 1.3 `notes` — `content/notes/*.md`

Same as blog minus category/cover/AI flags, plus:

| Field    | Type     | Required | Rules                                  |
| -------- | -------- | -------- | -------------------------------------- |
| `status` | enum     | ✅       | `seedling` \| `growing` \| `evergreen` |
| `tags`   | string[] | ✅       | ≥ 1                                    |

Convention (not schema): ≤ 500 words.

### 1.4 `photos` — `content/photos/*.md`

| Field        | Type    | Required | Rules                                      |
| ------------ | ------- | -------- | ------------------------------------------ |
| `title`      | string  | ✅       |                                            |
| `date`       | date    | ✅       | capture date preferred                     |
| `image`      | string  | ✅       | local path or R2 public URL                |
| `alt`        | string  | ✅       | **≥ 10 chars**, human-written              |
| `collection` | enum    | ✅       | `travel` \| `nature` \| `urban` \| `other` |
| `exif`       | object  | —        | `{ camera?, lens?, settings? }`            |
| `location`   | string  | —        | city level only                            |
| `draft`      | boolean | —        | default `false`                            |

The gallery is empty on purpose until there are photos worth the bandwidth.

## 2. Singletons

| File                     | Purpose                     | Key fields                                                         |
| ------------------------ | --------------------------- | ------------------------------------------------------------------ |
| `theme.yaml`             | design tokens               | `dark`/`light` palettes, `type_scale`, `motion`, `radii`, `layout` |
| `navigation.yaml`        | header + footer nav         | `entries[{label,url,visible,order,primary}]`                       |
| `site-config.yaml`       | identity + flags            | `name`, `role`, `email`, `availability`, `socials`, `flags`        |
| `seo.yaml`               | titles/descriptions         | `default`, `pages{route:{title,description}}`                      |
| `chatbot-config.yaml`    | assistant copy              | `enabled`, `greeting`, `suggested_questions`, `fallback_text`      |
| `pages/home.yaml`        | home copy                   | `hero`, `stats[]`, `sections[]`, `capabilities[]`, `cta`           |
| `pages/about.yaml`       | about copy                  | `story[]`, `quote`, `values[]`, `beyond`, `closing`                |
| `pages/projects.yaml`    | projects index              | `intro`, `empty`, `filters`, `labels`                              |
| `pages/blog.yaml`        | writing index               | `intro`, `empty`, `categories`, `labels`                           |
| `pages/lab.yaml`         | lab                         | `intro`, `notice`, `demos[]`                                       |
| `pages/gallery.yaml`     | gallery                     | `intro`, `empty`, `labels`                                         |
| `pages/contact.yaml`     | contact                     | `intro`, `channels`, `subjects[]`, `form`, `empty`                 |
| `pages/now.yaml`         | /now                        | `updated`, `focus[]`, `building`, `learning`, `looking_for`        |
| `timeline.yaml`          | education/projects timeline | `entries[{year,title,org,kind,description,href?}]`                 |
| `reading-list.yaml`      | books                       | `books[{title,author,status,rating?,review?}]`                     |
| `anime.yaml`             | screen time                 | `anime[]` (empty is valid and hidden)                              |
| `project-overrides.yaml` | owner layer                 | `overrides[{match,hidden,featured,displayTitle,category}]`         |
| `resume.json`            | JSON Resume                 | `basics`, `projects`, `skills`, `education`, `languages`           |
| `resume-config.yaml`     | template switch             | `active`, `allow_visitor_toggle`, `europass`                       |

## 3. Slugs and URLs

- A project's URL is its **filename**: `content/projects/skill-tracker-api.md` →
  `/projects/skill-tracker-api`. Never derived from the title, so a retitle does
  not break a link.
- Posts and notes behave the same: `/blog/<filename>`, `/notes/<filename>`.
- Tags are slugified for URLs (`Pydantic v2` → `/blog/tag/pydantic-v2`).
- Stack pages are generated only for stacks used by **two or more** projects;
  single-project stack pages would be thin duplicates of the project page.

## 4. Drafts

`draft: true` is excluded from the production build, from RSS, and from the
future knowledge base. `import.meta.env.DEV` is the only switch — a preview deploy
behaves like production, because a preview that leaks drafts is a production leak
with extra steps.

## 5. Adding content

### A new project

```bash
cp content/projects/skill-tracker-api.md content/projects/my-project.md
# edit frontmatter: title, description, dates, stack, status, order
# every outcome needs claim + metric + method
npm run check:content     # fast feedback
npm run dev               # look at it
```

### A new post

```bash
touch content/blog/my-post.mdx
```

Frontmatter minimum: `title`, `description`, `pubDate`, `category`. Add
`draft: true` if it is not ready — it still renders in `npm run dev`.

### A new page

1. Add the route file under `src/pages/`.
2. Add the path to `staticRoutes` in `scripts/check-content.mjs` (this is the
   route registry that makes nav validation possible).
3. Add it to `content/navigation.yaml` if it belongs in the nav.
4. Add a title/description override in `content/seo.yaml`.

## 6. Where copy lives

Every user-visible string belongs to `content/`. The only literals allowed in
components are structural labels that are part of the interface, and even those
are moving into `pages/*.yaml` as the site matures. If you find yourself editing
a sentence inside a `.astro` file, the string is in the wrong place.
