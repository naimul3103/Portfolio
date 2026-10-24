# Stack version verification

**Snapshot date:** 2026-10-24 · **Registry:** npmjs.com (`npm view`) · **Toolchain used for query:** npm 11.19.0, Node 24.20.0
**Scope:** the exact stack named in the brief (Astro 5 + Tailwind 4 + zod content collections + Playwright/Vitest/Biome + Pagefind + OG-image tooling).
**Nothing was installed.** All package facts come from registry metadata reads (`npm view`); all behavioural facts come from official docs or first-party source.

---

## 0. TL;DR (read this first)

1. **`astro@latest` is 7.4.2, not 5.x.** A bare `npm install astro` installs a framework **two major versions ahead of the spec**. The Astro 5 line ends at **5.18.2**
2. **The Astro integrations named in the brief have also moved past Astro 5.** `@astrojs/mdx@latest` (8.1.1) declares `peerDependencies.astro: ^7.2.10` and `engines.node: >=22.23.4`. For Astro 5 you must pin `@astrojs/mdx@4.3.14`
3. **`typescript@latest` is 7.0.2 and `astro check` explicitly refuses it.** First-party source prints: *"astro check does not currently support TypeScript 7.0. To continue using astro check, install TypeScript 6 instead."* `@astrojs/check@0.9.12` declares `peerDependencies.typescript: ^5.0.0 || ^6.0.0`. Pin **5.9.3**
4. **`sharp` is an `optionalDependency` of Astro 5, pinned at `^0.34.0`** — so `sharp` installs automatically and you do **not** need to add it. If you pin it explicitly for reproducibility, use **0.34.5**, not `latest` (0.35.5)
5. **Tailwind 4 wiring is unchanged and simple:** `@tailwindcss/vite` in `vite.plugins` + `@import "tailwindcss";` in your global CSS. No `tailwind.config.js` exists in v4.

Confidence: **high** for every version number (direct registry read, same day) and for the config shapes (official docs). **Medium** for the exact Astro-5 runtime behaviour of `@astrojs/sitemap@3.7.4` and `astro@5.18.2` on Node 24 — see §9.

---

## 1. Evidence tiers used in this document

| Tier | Meaning | What it covers here |
|---|---|---|
| A — first-party code | Registry `package.json` fields (`version`, `peerDependencies`, `engines`, `dependencies`, `exports`) and Astro's own CLI source | Every version, peer range and engine floor in §2 |
| B — official docs | docs.astro.build, tailwindcss.com, pagefind.app | Config shapes, breaking changes, CLI usage |
| C — inference | My reasoning over A+B | Marked inline with "inferred" |
| D — unverified | Could not confirm without installing | §9 only |

Docs caveat: `docs.astro.build` now documents **Astro 7**, not 5. Where a statement is version-sensitive I cite the **v5 upgrade guide** (`/en/guides/upgrade-to/v5/`) or registry metadata instead of the current page. The APIs the brief depends on (`src/content.config.ts`, `glob()`, `@tailwindcss/vite`) are unchanged from 5 → 7, so current docs remain valid for them.

---

## 2. Version table

`latest` = `npm view <pkg> version`, read 2026-10-24.

| Package | Latest version | Notes |
|---|---|---|
| `astro` | **7.4.2** | **Do not use latest.** Last 5.x = **5.18.2**. Astro 6 line ends at 6.4.8. `engines` on 5.18.2: `18.20.8 \|\| ^20.3.0 \|\| >=22.0.0`. Bundles `vite ^6.4.1`, `zod ^3.25.76`, `shiki ^3.21.0` |
| `@astrojs/mdx` | **8.1.1** | Latest requires `astro ^7.2.10` **and** `node >=22.23.4`. For Astro 5 use **4.3.14** (`peerDependencies.astro: ^5.0.0`, node `18.20.8 \|\| ^20.3.0 \|\| >=22`) |
| `@astrojs/sitemap` | **3.7.4** | No `peerDependencies` and no `engines` declared, so npm will not warn on Astro 5. Still 3.x — the integration API it targets is stable across 5/6/7. Pin `3.7.4` |
| `@astrojs/rss` | **4.0.19** | No peer/engine constraints. Pulls its own `zod ^4.3.6` (see §7.8 — this is a *nested* dep, not a reason to install zod 4 yourself) |
| `@astrojs/check` | **0.9.12** | `peerDependencies.typescript: ^5.0.0 \|\| ^6.0.0`. Required for `astro check`; it is **not** a transitive dep of `astro` |
| `tailwindcss` | **4.3.3** | v4 line. No `engines` field declared on the package. CSS-first config: no `tailwind.config.js` |
| `@tailwindcss/vite` | **4.3.3** | `peerDependencies.vite: ^5.2.0 \|\| ^6 \|\| ^7 \|\| ^8` → compatible with Astro 5.18's bundled `vite ^6.4.1` |
| `pagefind` | **1.5.2** | Ships a CLI (`bin: pagefind → lib/runner/bin.cjs`). Run *after* `astro build`, against `dist/` |
| `@fontsource-variable/inter` | **5.3.0** | Fontsource variable-font package; CSS + woff2, self-hosted |
| `@fontsource-variable/jetbrains-mono` | **5.3.0** | Same release train as Inter |
| `sharp` | **0.35.5** | **No direct dep needed.** `astro@5.18.2` lists it under `optionalDependencies: { "sharp": "^0.34.0" }`, so it installs automatically at 0.34.x. Latest 0.34.x = **0.34.5**. Forcing 0.35.5 at the top level leaves Astro with a second, nested 0.34.x — pointless. `sharp@0.34.5` declares `engines.node: ^18.17.0 || ^20.3.0 || >=21.0.0` |
| `typescript` | **7.0.2** | **Incompatible with `astro check`.** TS 6 line ends at 6.0.3; TS 5 line ends at **5.9.3** |
| `vitest` | **5.0.5** | `engines.node: ^22.12.0 \|\| ^24.0.0 \|\| >=26.0.0`; `peerDependencies.vite: ^6.4.0 \|\| ^7.0.0 \|\| ^8.0.0` → OK with Astro 5's Vite 6.4. **Breaks on Node 20** |
| `@biomejs/biome` | **2.6.2** | `engines.node >=14.21.3`. Independent of the Astro line |
| `@playwright/test` | **1.64.1** | `engines.node >=20` |
| `@axe-core/playwright` | **4.14.0** | `peerDependencies.playwright-core: >= 1.0.0` — satisfied by Playwright 1.64.1 |
| `yaml` | **2.9.1** | Pure-JS YAML parser; used for the YAML-driven data files |
| `zod` | **4.6.7** | **Not needed as a direct dep for this project.** Astro 5 bundles `zod ^3.25.76` and exposes it as `astro/zod`. `zod@4` is a different API surface (see §7.8) |
| `satori` | **0.63.2** | JSX→SVG for OG images; independent |
| `@resvg/resvg-js` | **2.6.2** | Native SVG→PNG renderer for the Satori output; independent |
| `@astrojs/cloudflare` | **14.4.2** | **Not usable with Astro 5.** 14.x declares `peerDependencies.astro: ^7.4.0` + `wrangler ^4.125.0`. Last Astro-5-compatible major: **12.6.13** (`astro ^5.7.0`). This project is static — no adapter should be installed |
| `wrangler` | **4.152.0** | Only needed if deploying via Cloudflare Workers/Pages CLI. Satisfies the 14.x adapter's `^4.125.0` if ever used |

### 2.1 Recommended pin block (Astro 5 line — matches the spec set)

```jsonc
{
  "dependencies": {
    "astro": "5.18.2",
    "@astrojs/mdx": "4.3.14",
    "@astrojs/sitemap": "3.7.4",
    "@astrojs/rss": "4.0.19",
    "@fontsource-variable/inter": "5.3.0",
    "@fontsource-variable/jetbrains-mono": "5.3.0",
    "tailwindcss": "4.3.3",
    "@tailwindcss/vite": "4.3.3",
    "yaml": "2.9.1",
    "satori": "0.63.2",
    "@resvg/resvg-js": "2.6.2"
  },
  "devDependencies": {
    "@astrojs/check": "0.9.12",
    "typescript": "5.9.3",
    "vitest": "5.0.5",
    "@biomejs/biome": "2.6.2",
    "@playwright/test": "1.64.1",
    "@axe-core/playwright": "4.14.0",
    "pagefind": "1.5.2",
    "wrangler": "4.152.0"
  },
  "engines": { "node": ">=22.12.0" }
}
```

Deliberate omissions: **no `zod`** (use `astro/zod`), **no `sharp`** (Astro 5 installs `^0.34.0` itself — add `"sharp": "0.34.5"` only if you want the version visible in `package.json`), **no `@astrojs/cloudflare`** (static output). `wrangler` is optional — drop it if deployment is pure GitHub Pages.

If the owner would rather track the current framework instead of the spec's Astro 5, the same table supports it: `astro@7.4.2` + `@astrojs/mdx@8.1.1` + `@astrojs/cloudflare@14.4.2`, with Node ≥22.23.4. **That is a spec change, not a version bump** — flag it, don't do it silently.

---

## 3. Minimal correct `astro.config.mjs` (Astro 5 + Tailwind 4)

Tailwind's official Astro guide prescribes exactly three things — install `tailwindcss` + `@tailwindcss/vite`, add the plugin to `vite.plugins`, and `@import "tailwindcss";` in a CSS file:

```js
// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://naimul3103.github.io', // REQUIRED for sitemap + absolute RSS/canonical URLs
  output: 'static',                     // default in Astro 5; 'hybrid' was removed in v5
  integrations: [mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

Notes that matter:

* The file name is **`astro.config.mjs`** at the project root. `.ts` also works in v5, but `.mjs` is what every official example uses.
* `site` is not optional in practice: `@astrojs/sitemap` needs it, and RSS/canonical/OG URLs are built from it. A wrong value here silently produces a wrong `sitemap-index.xml`.
* **No `tailwind.config.js`.** Tailwind 4 is CSS-first; theme tokens go in `@theme { ... }` inside the CSS file.
* Do **not** add `@astrojs/tailwind` — that integration is the v3-era path and is not used with v4.

### 3.1 `src/styles/global.css`

```css
@import "tailwindcss";

/* design tokens — replaces tailwind.config.js theme.extend */
@theme {
  --color-bg: oklch(0.98 0 0);
  --color-fg: oklch(0.22 0 0);
  --font-sans: "Inter Variable", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono Variable", ui-monospace, monospace;
}
```

Imported once, from the base layout: `import '../styles/global.css';` in the frontmatter of `src/layouts/Base.astro`.

---

## 4. Content collections from an external `content/` directory

The glob loader explicitly supports this: it *"creates entries from directories of files from anywhere on the filesystem"*, and `base` is *"a relative path or URL to the directory from which to resolve the `pattern`"* (default `"."`). So a repo-root `content/` folder is first-class — no symlink, no `src/content/` indirection.

File location is the part people get wrong: it is **`src/content.config.ts`**, *not* `src/content/config.ts` (the latter only survives as a deprecated v4-compat shim).

```ts
// src/content.config.ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';           // Astro's bundled zod 3 — do NOT import from 'zod'

const writing = defineCollection({
  loader: glob({
    base: './content/writing',           // repo-root folder, outside src/
    pattern: '**/[^_]*.{md,mdx}',        // [^_] keeps drafts/partials out
  }),
  schema: z.object({
    title: z.string().max(120),
    description: z.string().max(200),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    cover: z.string().optional(),
    coverAlt: z.string().optional(),
  }).refine((d) => !d.cover || !!d.coverAlt, {
    message: 'coverAlt is required when cover is set',
    path: ['coverAlt'],
  }),
});

export const collections = { writing };
```

Consuming it (the v5 Content Layer contract):

```astro
---
import { getCollection, render } from 'astro:content';

const posts = (await getCollection('writing', ({ data }) => !data.draft))
  .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

const { Content, headings } = await render(posts[0]);  // NOT posts[0].render()
---
```

Three v5 rules that break v4-era snippets:
1. entries have **`id`**, not `slug` — `params: { slug: post.id }`;
2. rendering is the standalone **`render(entry)`** from `astro:content`, because entries are now plain serializable objects;
3. no `type: 'content' | 'data'` on `defineCollection` — the presence of `loader` decides.

**Caveat for the `[^_]` pattern:** `glob` uses micromatch. `**/[^_]*.{md,mdx}` is copied from the official v5 upgrade guide and is correct, but a leading-underscore file *inside a subfolder* is only excluded at that segment. If drafts are a real workflow, prefer `draft: true` in frontmatter (as above) over filename conventions.

---

## 5. Does `astro check` need `@astrojs/check` + `typescript`?

**Yes, both, installed in the project.** `@astrojs/check` is not a dependency of `astro`. Astro's own CLI source is unambiguous:

> ``The `@astrojs/check` and `typescript` packages are required for this command to work. Please manually install them into your project and try again.``
> — `packages/astro/src/cli/check/index.ts` (main branch)

The same file contains the TypeScript 7 guard quoted in §0.3. Practical setup:

```jsonc
// package.json
"scripts": {
  "check": "astro check",
  "check:watch": "astro check --watch"
}
```

```bash
npm i -D @astrojs/check@0.9.12 typescript@5.9.3
```

Valid `astro check` flags worth knowing (from the CLI reference): `--minimumFailingSeverity <error|warning|hint>` (default `error` — set it to `warning` if CI should fail on warnings), `--minimumSeverity`, `--tsconfig`, `--noSync`, `--watch`.

`tsconfig.json` should extend a preset and include the generated types:

```jsonc
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

Forward-looking note: Astro is signalling that `astro check` will eventually be deprecated in favour of `@astrojs/ts-content-mapper` for TypeScript 7.1+. Irrelevant for an Astro 5 pin, but it explains why the TS 7 guard exists.

---

## 6. Pagefind against `dist/`

Pagefind indexes the **built HTML**, so ordering is load-bearing: `astro build` → `pagefind --site dist` → deploy. Indexing before the build, or against `src/`, produces an empty/partial index with no error.

```jsonc
// package.json
"scripts": {
  "build": "astro build",
  "postbuild": "pagefind --site dist",     // npm runs this automatically after `npm run build`
  "preview": "astro preview"
}
```

* Minimal CLI: `npx pagefind --site dist` (the `--site` flag points at the directory of static HTML).
* Output: a **`dist/pagefind/`** directory containing the index chunks and the browser runtime. It is generated, so it belongs in `.gitignore` but **must** ship in the deploy artifact.
* `--serve` is a local convenience flag (serves the built site, typically on `:1414`); never use it in CI.
* UI wiring, Pagefind **1.5.x** (current generation is the *Component UI*):

```html
<link href="/pagefind/pagefind-component-ui.css" rel="stylesheet">
<script src="/pagefind/pagefind-component-ui.js" type="module"></script>

<pagefind-modal-trigger></pagefind-modal-trigger>
<pagefind-modal></pagefind-modal>
```

The older `pagefind-ui.js` / `PagefindUI({ element })` API still exists and is still documented, but 1.5 ships the component UI as the default recommendation. Pick one and stay consistent — the two have different CSS and different init code.

* Index scoping: put `data-pagefind-body` on the content wrapper to exclude nav/footer noise; `data-pagefind-ignore` on chrome you never want searched. Without `data-pagefind-body`, Pagefind indexes the whole `<body>`.
* Set `<html lang="...">` — Pagefind uses it for language-aware stemming, and it is also an a11y/Lighthouse requirement here.
* A build that emits zero pages exits 0 with `Indexed 0 pages`. Treat "Indexed 0 pages" as a CI failure.

---

## 7. Gotchas (each one will bite a fresh project)

**7.1 `npm install astro` is not Astro 5.**
`latest` = 7.4.2; 5.x terminal release = 5.18.2. With `"astro": "^5.0.0"` npm resolves 5.18.2 correctly — but `npm i astro@latest`, `npx create-astro@latest`, and every copy-pasted tutorial will pull v7. Also expect `npx @astrojs/upgrade` to move you to 7.x; do not run it casually.
Evidence: registry `dist-tags` (`latest: 7.4.2`, `legacy: 4.16.19`), version list (`5.18.2` last 5.x).
<https://registry.npmjs.org/astro>

**7.2 Integration majors track the framework major.**
`@astrojs/mdx@8.1.1` → `astro ^7.2.10` + `node >=22.23.4`. `@astrojs/cloudflare@14.4.2` → `astro ^7.4.0`. Installing "latest everything" against Astro 5 yields `ERESOLVE` at best and a silently mismatched integration at worst. Always let `@astrojs/upgrade` pick integration versions, or pin per §2.1.
Evidence: registry `peerDependencies`/`engines` for each package.

**7.3 TypeScript 7 breaks `astro check` — hard stop, not a warning.**
`typescript@latest` = 7.0.2. `@astrojs/check@0.9.12` peers `^5.0.0 || ^6.0.0`, and the CLI short-circuits on TS ≥ 7 with *"astro check does not currently support TypeScript 7.0."* Pin `5.9.3`. This is the single most likely "why is CI red on day one" failure.
Evidence: `packages/astro/src/cli/check/index.ts`; registry `peerDependencies`.
<https://docs.astro.build/en/reference/cli-reference/#astro-check>

**7.4 `sharp` ships with Astro 5 — don't "upgrade" it.**
`astro@5.18.2` declares `optionalDependencies: { "sharp": "^0.34.0" }`, so a plain `npm install astro` already provides the image service. Adding `sharp@0.35.5` at the top level does not break the build, but it splits the dependency into a hoisted 0.35.5 and a nested 0.34.x for Astro — two native binaries, two install paths, no benefit. If you want it explicit, pin **0.34.5**. Astro 5 also removed Squoosh, so `sharp` is the *only* image service; and because it is a native binary, a Node major bump may require a clean reinstall to fetch the matching prebuilt.
Evidence: registry `optionalDependencies` on `astro@5.18.2` (queried separately from `peerDependencies`, which is empty); v5 upgrade guide (*Removed: Squoosh image service*).
<https://docs.astro.build/en/guides/upgrade-to/v5/>

**7.5 Tailwind 4 has no config file and no `@tailwind` directives.**
v4 removed `@tailwind base/components/utilities` in favour of a single `@import "tailwindcss";`. `tailwind.config.js` is replaced by `@theme` in CSS. The PostCSS plugin moved to `@tailwindcss/postcss`; with Astro you use `@tailwindcss/vite` instead of PostCSS entirely. `postcss-import` and `autoprefixer` should be removed if present.
<https://tailwindcss.com/docs/upgrade-guide#removed-tailwind-directives>
<https://tailwindcss.com/docs/installation/framework-guides/astro>

**7.6 Tailwind 4's browser floor is a real constraint.**
Chrome 111+, Safari 16.4+, Firefox 128+ (it depends on `@property` and `color-mix()`). For a Bangladesh-heavy, Android-heavy audience this is generally fine in 2026, but it rules out old Android WebViews and any in-app browser pinned to an older Chromium. Decide deliberately; there is no compat mode.
<https://tailwindcss.com/docs/compatibility#browser-support>

**7.7 `@apply` inside an Astro `<style>` block does not work without `@reference`.**
Astro's scoped `<style>` is processed as a separate CSS module, so it has no `@theme` context. Tailwind's own docs recommend avoiding `<style>` blocks and using utilities in markup; if you must, add `@reference "../styles/global.css";` at the top of the block. This bites specifically when porting a Tailwind-3 design system that used `@apply` in component CSS.
<https://tailwindcss.com/docs/compatibility#vue-svelte-and-astro>

**7.8 Two zod majors will be in `node_modules`; pick the right import.**
Astro 5 bundles `zod ^3.25.76`; `@astrojs/rss@4.0.19` depends on `zod ^4.3.6`. Import `z` from **`astro/zod`** (or `astro:content`) for collection schemas and for `src/lib/*.ts` data schemas — that resolves to Astro's zod 3. Importing from a top-level `zod@4` gives you a different API (`z.string().email()` deprecated, error shape changed) and two schema dialects in one repo. Recommended: add **no** `zod` dependency at all.
Evidence: `astro@5.18.2` `dependencies.zod: ^3.25.76`; `@astrojs/rss@4.0.19` `dependencies.zod: ^4.3.6`; `astro@5.18.2` exports include `./zod`.

**7.9 The content config file moved, and `slug` is gone.**
`src/content.config.ts` (project `src/`, not inside `src/content/`). Entries expose `id`; rendering uses `render(entry)` imported from `astro:content`. Any v4 tutorial using `post.slug` or `post.render()` is wrong for v5.
<https://docs.astro.build/en/guides/upgrade-to/v5/#legacy-v20-content-collections-api>

**7.10 Node floors differ per package — the max wins.**
Astro 5.18.2: `>=22` is fine (`18.20.8 || ^20.3.0 || >=22.0.0`). Vitest 5: `^22.12.0 || ^24 || >=26` (Node 20 fails). Current Astro docs (v7) state `v22.12.0` minimum. Net floor for this repo: **Node 22.12+**, which matches `11-tech-specs.md:16` ("Node ≥ 22 LTS"). Pin it in `.nvmrc` and `engines` so CI and Cloudflare Pages agree.
<https://docs.astro.build/en/install-and-setup/#prerequisites>

**7.11 `output: 'hybrid'` no longer exists.**
Removed in v5. Only `'static'` and `'server'` remain; per-route `export const prerender = false` is how you opt individual routes into on-demand rendering. A static portfolio should never set anything but `'static'`.
<https://docs.astro.build/en/guides/upgrade-to/v5/#removed-hybrid-rendering-mode>

**7.12 `astro:content` cannot be imported on the client.**
Changed in v5. Collection queries must stay in `.astro` frontmatter, endpoints, or server-side modules — never in a `<script>` that ships to the browser. Relevant if a client-side search/filter component is tempted to `getCollection()`; the correct pattern is to serialise the needed fields at build time (or let Pagefind do the searching).
<https://docs.astro.build/en/guides/upgrade-to/v5/#changed-astrocontent-can-no-longer-be-used-on-the-client>

---

## 8. Conflicts with the spec set (flag, don't silently fix)

| Spec claim | Reality on 2026-10-24 | Action |
|---|---|---|
| `11-tech-specs.md:14` — "Tailwind CSS 4, caret" | Still correct; 4.3.3 is the v4 line | none |
| `11-tech-specs.md:16` — "Node ≥ 22 LTS" | Correct and is now the binding floor (Vitest 5 needs ≥22.12) | pin `>=22.12.0`, not `>=22.0.0` |
| Spec set names **Astro 5** throughout | Astro `latest` is 7.4.2; 5.18.2 is the last 5.x. Astro 5 receives no further features and its integration majors have moved on | **Decision needed by owner.** Either pin 5.18.2 exactly (this document's §2.1) or amend the spec to Astro 7. Do not mix |
| `11-tech-specs.md:457` — `pnpm exec pagefind --site dist` | Correct usage and correct ordering | keep; add "assert `Indexed > 0 pages`" |

---

## 9. Unverified / open items

1. **`@astrojs/sitemap@3.7.4` on Astro 5.18.2** — no peer constraint is declared, so npm cannot warn either way. Verify by building and checking that `dist/sitemap-index.xml` and `dist/sitemap-0.xml` exist. If the integration errors on a changed hook signature, step back through 3.6.x.
2. **`astro@5.18.2` on Node 24.20.0** — `engines` permits `>=22`, but 5.x was validated mostly on 18/20/22. Not empirically tested here (no install allowed). If `astro build` misbehaves, test on Node 22.12 before debugging anything else.
3. **`vitest@5.0.5` + Astro 5's Vite 6.4** — the peer range allows `^6.4.0`, but Vitest 5 ships its own Vite resolution; a duplicated Vite in `node_modules` is possible. Symptom: `Cannot find module 'vite'` or two Vite copies in `npm ls vite`. Fix by pinning `vitest@4.1.12` (also `vite ^6` compatible, and `engines.node` is looser) if it appears.
4. **Exact `pagefind` legacy-UI asset names** — I confirmed the 1.5 Component UI paths (`/pagefind/pagefind-component-ui.{css,js}`) from the official quick start; the legacy `pagefind-ui.js` path is documented as still available but I did not pin its exact filename in this pass. Decide which UI generation the search page uses before writing that component.
5. **`@fontsource-variable/*` 5.3.0 file names** — `"Inter Variable"` / `"JetBrains Mono Variable"` are the conventional `font-family` names, but confirm against the package's own `index.css` after install; a wrong family name fails silently (fallback font, no error).

---

## 10. Commands used (reproducible, read-only)

```bash
npm view <pkg> version                    # 22 packages, 2026-10-24
npm view astro dist-tags --json
npm view astro versions --json            # → last 5.x = 5.18.2
npm view astro@5.18.2 dependencies engines exports --json
npm view @astrojs/mdx@8.1.1 peerDependencies engines --json
npm view @astrojs/mdx@4.3.14 peerDependencies engines --json
npm view @astrojs/check@0.9.12 peerDependencies --json
npm view vitest@5.0.5 peerDependencies engines --json
npm view @tailwindcss/vite@4.3.3 peerDependencies --json
```

Docs read in full: `docs.astro.build` → install-and-setup, guides/typescript, guides/styling, guides/upgrade-to/v5, guides/content-collections, reference/modules/astro-content, reference/content-loader-reference, reference/cli-reference; `tailwindcss.com` → installation/framework-guides/astro, docs/upgrade-guide, docs/compatibility; `pagefind.app` → docs/, docs/running-pagefind/, docs/search-ui/, docs/ui/; plus `raw.githubusercontent.com/withastro/astro/main/packages/astro/src/cli/check/index.ts`.
