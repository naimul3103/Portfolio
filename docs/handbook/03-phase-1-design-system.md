# Phase 1 — Design System & App Shell

> **Status:** NOT STARTED · **Depends on:** G0 · **Effort:** 14–18 h (2 weeks) · **Exit gate:** G1
> **Spec references:** [`11-tech-specs.md`](11-tech-specs.md) §3 (schemas: `theme.yaml`, `pages/home.yaml`, `navigation.yaml`, `site-config.yaml`) · [`12-quality-specs.md`](12-quality-specs.md) §2 (contrast/a11y), §3 (perf) · Blueprint v4 Parts 4, 5, 14.5, 15.5

---

## 1.1 Objectives

Build the design system as **data, not decoration**: a token pipeline that turns `content/theme.yaml` into CSS custom properties, a fluid typography scale, and the persistent app shell (header, nav, footer, dark-mode toggle) that every later page renders inside. The home page ships this phase as the first real composition — consuming its copy from `content/pages/home.yaml` so the "nothing hard-coded" rule (Blueprint Part 14.3) is honored from the first commit rather than retrofitted. The phase also delivers the two mechanical guardrails that keep an owner-editable theme safe: a **contrast CI gate** and a **no-raw-hex lint check**.

## 1.2 Scope

| In scope                                                                                           | Out of scope (goes to)                                                                      |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `content/theme.yaml` + build step emitting `tokens.css`                                            | Any CMS exposure of theme (P4)                                                              |
| Fluid type scale (clamp, rem-based), `text-wrap: balance`                                          | Full typography for prose pages (P2 supplies content width rules)                           |
| Fonts: self-hosted variable font, subset, `font-display: swap`                                     | Tabular-nums/stat styling (P2, used where stats exist)                                      |
| `BaseLayout`, `Header` (responsive nav from `navigation.yaml`), `Footer` (from `site-config.yaml`) | Other pages (P2 builds routes)                                                              |
| Dark/light toggle (persisted, no-JS fallback, respects `prefers-color-scheme`)                     | Chatbot / islands (P6)                                                                      |
| Home page: hero, section components, glass card component                                          | Home data sections (featured projects, activity — render placeholders from P2 seed content) |
| Contrast gate script + hex lint check                                                              | Full axe/Lighthouse CI wiring (P7; basic Lighthouse local run here)                         |

## 1.3 Prerequisites (Entry Criteria)

G0 passed (CI + Pages deploy live). Design tokens vocabulary confirmed against Blueprint 14.5 (5 color roles, gradient pair, 3 radii, spacing base, type-scale selector, motion level).

## 1.4 Task Breakdown

| ID    | Task                                                  | Details / spec ref                                                                                                                                                                                                                                                                               | Est    | Depends                                                                                                                                                                      |
| ----- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1-01 | Author `content/theme.yaml` + token pipeline          | Schema in tech-specs §3.1. A small build script (`scripts/tokens.ts`) reads YAML → emits `src/styles/tokens.css` as CSS custom properties (`--bg`, `--surface`, `--text`, `--muted`, `--accent`, `--gradient-a/b`, radii, spacing, type-scale, motion). Run in `prebuild` + committed for review | 2.5 h  | —                                                                                                                                                                            |
| P1-02 | Fluid typography system                               | Implement the 2026 standard scale from Blueprint 15.5 exactly (`--step--1…-3`, rem-based clamp, body ≥ 16px, line-height 1.6, inputs ≥ 16px). Wrap: `h1,h2,h3 { text-wrap: balance }`                                                                                                            | 1.5 h  | P1-01                                                                                                                                                                        |
| P1-03 | Fonts: one variable family, self-hosted               | Use `@fontsource-variable` package for the chosen family (Inter-class variable for text; optional mono for code). Subset ranges via package options; verify ≤ 120 KB total woff2 across the site (12-quality §3). `font-display: swap`                                                           | 1.5 h  | P1-02                                                                                                                                                                        |
| P1-04 | Motion + reduced-motion tokens                        | `motion: none                                                                                                                                                                                                                                                                                    | subtle | full`maps to CSS:`none`disables transitions globally + hides decorative canvases (Blueprint 10.3 CSS verbatim);`subtle`default.`prefers-reduced-motion` overrides all levels | 1 h | P1-01 |
| P1-05 | `BaseLayout` + SEO head component                     | `<head>`: charset, viewport, title/description props (defaults from `seo.yaml` placeholder), canonical, favicon, OG tags stub (real OG images in P3), theme-color from tokens                                                                                                                    | 2 h    | P1-02                                                                                                                                                                        |
| P1-06 | `Header` + responsive nav consuming `navigation.yaml` | Schema: entries `{label, url, visible, order}` (tech-specs §3.3). Mobile: hamburger → disclosure menu, 44px targets, focus trap, `aria-expanded`, ESC closes. **No-JS fallback:** nav links render visible on small screens without JS                                                           | 3 h    | P1-05                                                                                                                                                                        |
| P1-07 | `Footer` from `site-config.yaml`                      | Social links, copyright line, availability badge (Blueprint 12.4 Settings), "last updated" placeholder (heartbeat fills it in P6)                                                                                                                                                                | 1 h    | P1-05                                                                                                                                                                        |
| P1-08 | Dark mode toggle                                      | Three states: system / dark / light. Persisted in `localStorage`, class on `<html>`, no flash on load (inline script ≤ 1KB, hash-allowed in CSP later). Toggle respects keyboard + `aria-pressed`                                                                                                | 1.5 h  | P1-01                                                                                                                                                                        |
| P1-09 | Home page composition from `pages/home.yaml`          | Sections: hero (headline, rotating tagline array, CTA), featured slots (placeholder cards), skills note, latest-post slot, CTA band. Sections toggleable + reorderable via YAML (`order`, `visible`) per Blueprint 14.6 — sections can hide/reorder, never delete                                | 3 h    | P1-06                                                                                                                                                                        |
| P1-10 | Glass card component + button styles                  | Card per Blueprint 4.3 (glass surface, hover lift, shadow tokens); buttons: primary (gradient), secondary (ghost), tertiary (text). All colors via `var(--…)`, zero literals                                                                                                                     | 1.5 h  | P1-01                                                                                                                                                                        |
| P1-11 | Contrast gate script `scripts/check-contrast.mjs`     | Reads `theme.yaml`, computes WCAG ratios for the 5 defined pairs (text/bg, muted/bg, accent/bg, text/surface, muted/surface), fails < 4.5:1 with plain-language error (Blueprint 14.5). Wire into CI as a step                                                                                   | 1.5 h  | P1-01                                                                                                                                                                        |
| P1-12 | Hex-lint check `scripts/check-no-hex.mjs`             | Grep `src/` for `#[0-9a-fA-F]{3,8}` and `rgb(` outside `src/styles/tokens.css`; allowlist file for exceptions (SVGs). Enforced in CI — mechanical enforcement of "nothing hard-coded"                                                                                                            | 1.5 h  | P1-11                                                                                                                                                                        |
| P1-13 | Local baseline audit                                  | Lighthouse (local, mobile preset): a11y ≥ 95, perf ≥ 90 on home; fix findings; record scores in this file's changelog                                                                                                                                                                            | 1.5 h  | P1-09                                                                                                                                                                        |

## 1.5 Implementation Notes

**Token pipeline direction.** The source of truth is `content/theme.yaml`; `tokens.css` is a **build artifact that gets committed** (so PRs show visual diffs as CSS) but is regenerated on every build — a mismatch means the script broke, which CI catches by regenerating and diffing. This keeps the admin panel (P4) able to retheme by editing one YAML file while components stay pure `var()` consumers.

**Why the type scale is frozen now.** Every later page inherits rhythm from `--step-*`; retrofitting type is the classic portfolio-debt trap (Blueprint 15.5's whole point). The three curated `type_scale` options (`compact | modular | editorial`) multiply the base steps by 1.2 / 1.25 / 1.333 — implement as three precomputed token sets, not runtime math.

**Nav without JS.** Astro renders static HTML; the disclosure menu is a `<details>`-based progressive enhancement or CSS `:has()` pattern, so a JS-disabled visitor still navigates. This one decision protects the a11y gate in P7 and matches the "static-first" principle.

**Home placeholders are real components.** The featured-projects slot renders a card grid from an empty-but-schema-valid `projects` fixture; when P2 seeds content, the slot fills with zero component changes. Placeholders that use fake markup would create double work — this way there is exactly one implementation.

## 1.6 Acceptance Criteria

- [ ] Home page renders at 360 / 768 / 1280 px without horizontal scroll; nav usable at all three (keyboard + touch)
- [ ] Lighthouse (local, mobile): **Accessibility ≥ 95**, Performance ≥ 90 on `/`
- [ ] Dark mode: toggling persists across reloads; no FOUC; respects `prefers-color-scheme` on first visit; `motion: none` disables all transitions
- [ ] `scripts/check-contrast.mjs` passes on default theme AND fails when given a deliberately low-contrast fixture (proven once in a throwaway branch)
- [ ] `scripts/check-no-hex.mjs` passes; CI runs both guard scripts on every PR
- [ ] Editing `content/pages/home.yaml` headline and merging visibly changes production — **config-as-content proven end to end**
- [ ] Total first-load JS on home ≤ 20 KB gzip (the toggle script; budget headroom reserved for P3/P6)
- [ ] Fonts: ≤ 2 woff2 files, ≤ 120 KB, `swap`, no third-party font CDN

## 1.7 Definition of Done (Phase)

All acceptance boxes ticked · component inventory documented (`docs/components.md`: name, props, where used) · contrast + hex guard scripts merged into `ci.yml` · any design decision that deviated from Blueprint Part 4/15.5 recorded with rationale in this file's changelog.

## 1.8 Exit Gate G1 — Shell Rendered

| #   | Check                                                                        | Verified by                  |
| --- | ---------------------------------------------------------------------------- | ---------------------------- |
| 1   | Production home responsive + dark mode functional                            | browser at 3 widths + toggle |
| 2   | Guardrails active: contrast gate + hex lint in CI, demonstrated failure      | failing-PR evidence          |
| 3   | All visible home strings sourced from `pages/home.yaml` / `site-config.yaml` | grep audit in PR             |
| 4   | Local Lighthouse thresholds met                                              | recorded scores              |
| 5   | Layouts/components ready to consume P2 collections                           | code review                  |

## 1.9 Risks & Rollback

**Design churn risk (mid-phase "let me try another palette")** is the top schedule threat here. Countermeasure: theme.yaml edits are cheap (that's the design), but _token vocabulary_ changes (adding roles) require updating the schema, the pipeline, and the contrast pairs together — treat as a scoped PR, not a drive-by. **Rollback:** everything is in git; a bad theme is one `git revert` (Blueprint 14.5). The committed `tokens.css` means even a broken build script leaves the last-known-good CSS in-tree.

**Changelog:** _(record actuals: hours, Lighthouse scores, token changes)_

---

_Next phase: [`04-phase-2-content-engine.md`](04-phase-2-content-engine.md)_
