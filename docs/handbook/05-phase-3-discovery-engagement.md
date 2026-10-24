# Phase 3 — Discovery & Engagement

> **Status:** NOT STARTED · **Depends on:** G2 · **Effort:** 16–20 h (2 weeks) · **Exit gate:** G3
> **Spec references:** [`11-tech-specs.md`](11-tech-specs.md) §6 (contact Worker API), §9 (OG build job) · [`12-quality-specs.md`](12-quality-specs.md) §5 (SEO spec) · Blueprint v4 Parts 10.2, 15.6, 15.7

---

## 3.1 Objectives

Make the content from P2 **findable, shareable, and interactive**: site search (Pagefind), RSS/sitemap, complete SEO metadata with structured data, per-page OG share cards (Satori), blog comments (giscus), a finished `/now` page, and the contact form with Turnstile + Resend behind a Worker. Every feature in this phase comes from the v4 research audit's shortcoming list (Part 15.7) — each is config-gated in `site-config.yaml`, so the owner can switch any of them off from the admin panel without code changes.

## 3.2 Scope

| In scope                                                                                  | out of scope (goes to)                                             |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Pagefind static search (post-build index, UI, state matrix)                               | Search over admin/draft content (excluded by design)               |
| RSS/Atom (`@astrojs/rss`: blog + notes) + sitemap (`@astrojs/sitemap`)                    | Newsletter (rejected — Blueprint 15.10)                            |
| SEO head completion: title patterns, canonical, robots meta, Person + BlogPosting JSON-LD | Search Console submission (P7 verifies, P8 announces)              |
| OG cards: Satori build-time generation for pages/posts                                    | OG for CMS previews                                                |
| giscus comments (public repo + Discussions, Announcements category, per-post toggle)      | Comment moderation automation (GitHub-native moderation is enough) |
| `/now` page completed (singleton + auto timestamp)                                        | Heartbeat automation that stamps it (P6)                           |
| Contact form: static form → Pages Function/Worker → Resend; Turnstile; honeypot           | Chatbot (P6 — shares the Worker patterns)                          |
| Cloudflare Web Analytics (cookieless) + 404 + robots.txt                                  | Lighthouse CI budget enforcement (P7)                              |

## 3.3 Prerequisites (Entry Criteria)

G2 passed. Repo is **public** (required for giscus — a deliberate, privacy-reviewed decision; the repo contains no secrets by P0's `docs/secrets.md` rule). Resend account + domain-verified sender (for the form) and Turnstile site/secret keys created — the first real rows in `docs/secrets.md`.

## 3.4 Task Breakdown

| ID    | Task                         | Details / spec ref                                                                                                                                                                                                                                                                                                        | Est      | Depends                                                                             |
| ----- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------- |
| P3-01 | Pagefind integration         | Post-build step (`pagefind --site dist`); UI island: `/search` page + header trigger; **state matrix per Blueprint 15.6**: instant (local index), "No hits — try fewer words" empty copy (CMS-editable), count + highlighted results; index excludes `/admin` via pagefind config                                         | 3 h      | —                                                                                   |
| P3-02 | RSS + sitemap                | `@astrojs/rss` feed at `/rss.xml` (blog + notes, newest 30), `@astrojs/sitemap` with lastmod from dates; both linked in `<head>`; validate feed with W3C validator once                                                                                                                                                   | 1.5 h    | —                                                                                   |
| P3-03 | SEO head completion          | Implement title patterns table exactly (Blueprint 10.2 / quality-specs §5): Home/Projects/Blog/Resume patterns; `seo.yaml` per-page overrides win; canonical from `site_url`; robots meta; `og:*` + `twitter:*` tags consuming OG images from P3-04                                                                       | 2.5 h    | —                                                                                   |
| P3-04 | Person + BlogPosting JSON-LD | Person block (Blueprint 10.2 example as base, fields from `site-config.yaml` + `resume.json` placeholder); BlogPosting per post with datePublished/Modified, author→Person, image→OG card; emitted via a `JsonLd.astro` component (not string concat)                                                                     | 2 h      | P3-03                                                                               |
| P3-05 | Satori OG pipeline           | `scripts/og.mjs`: iterate pages/posts → render card (title, tagline, gradient from `theme.yaml`) with `satori` → PNG via `resvg-js` → emit `dist/og/*.png`; run in CI build (after `astro build`, before Pagefind); fallback: single static card if a render fails (feature flag `og_images: true` in `site-config.yaml`) | 3 h      | —                                                                                   |
| P3-06 | giscus comments              | Install giscus app on repo; **Announcements category** (Blueprint 15.7 caveat); `Comments.astro` island lazy-mounted (`client:visible`) on posts; per-post `comments: off` frontmatter; dark-mode theme sync; repo-public decision logged in changelog                                                                    | 2 h      | —                                                                                   |
| P3-07 | `/now` completion            | Page from `pages/now.yaml` (current focus, learning, building, reading sections — owner-editable strings); "Last updated" renders from timestamp file with graceful "not yet stamped" state until P6 heartbeat                                                                                                            | 1 h      | —                                                                                   |
| P3-08 | Contact form + Worker        | Static form (name, email, message, honeypot field) → `POST /api/contact` (Pages Function or separate Worker — spec in tech-specs §6.2): Turnstile server-side verify → Resend send → 200; **state matrix**: inline field errors, Resend-failure retry, "Sent — reply within 24h" success; spam stats in CWA events        | 3.5 h    | —                                                                                   |
| P3-09 | Analytics + 404 + robots.txt | Cloudflare Web Analytics token in `<head>` (no cookie banner — Blueprint 10.7); 404 with search + nav recovery; `public/robots.txt` referencing sitemap                                                                                                                                                                   | 1.5 h    | —                                                                                   |
| P3-10 | Feature flags wiring         | All five features gated in `site-config.yaml`: `search`, `feed`, `comments: on                                                                                                                                                                                                                                            | per_post | off`, `og_images`, `now_page` (Blueprint 15.7); toggling rebuilds without code diff | 1 h | all |

## 3.5 Implementation Notes

**Pagefind ordering matters.** Pipeline order in CI: `astro build` → `og.mjs` (adds images into `dist/`) → `pagefind --site dist` (indexes final HTML incl. image references) → Pages Git integration deploys `dist`. Document this order in the Pages build config comment — it is the most common integration mistake.

**OG cards must use tokens, not copies.** The Satori template reads `theme.yaml` for the gradient — same source as the site. Otherwise a P4 retheme produces a site and share cards that disagree, a subtle inconsistency that looks like sloppiness in a link preview.

**Turnstile is server-side or it is decorative.** The widget proves nothing without the Worker verifying the token against `https://challenges.cloudflare.com/turnstile/v0/siteverify` — the form is a bot target because it reaches a free email quota (Blueprint 10.1). Honeypot + Turnstile + per-IP send cap (KV, 3/day) keeps Resend's 100/day tier safe for real humans.

**The contact Worker is the P6 dress rehearsal.** Build it with the exact patterns the chatbot Worker needs: secrets in Worker env bindings (never `PUBLIC_*` vars), `wrangler.toml` in repo, deploy via `wrangler deploy` in a dedicated Actions workflow (`deploy-worker.yml`, tech-specs §9.2), Sentry enabled. Getting this 100-line Worker right makes P6's chatbot a copy-paste exercise.

**giscus + the "public repo" trade.** Going public also exposes the draft-PR content flow — visible diffs before publish. Acceptable for a personal portfolio (and Blueprint 12.2 already chose Sveltia on this basis), but log the decision. If it ever bothers the owner: giscus off via `comments: off`, repo private, comments feature removed in one rebuild — the flag exists precisely for this.

## 3.6 Acceptance Criteria

- [ ] Search: finds seeded terms across posts/projects/notes in < 100 ms local; empty-state copy shows; `/admin` **not** in index (verify via a known admin-only string)
- [ ] `/rss.xml` validates (W3C) and includes latest posts + notes; `/sitemap-index.xml` exists; both discovered from `<head>`
- [ ] Lighthouse SEO **= 100** on home, a post, and a project page
- [ ] Every public page emits correct OG image (spot-check LinkedIn/Slack preview or `curl` the meta URLs); a disabled `og_images` flag falls back to the static card
- [ ] Person JSON-LD validates in Schema.org validator; BlogPosting present on posts; Rich Results test run once, output saved to `docs/`
- [ ] Comments: appear on a published post (test comment via GitHub login), absent on `comments: off` post, lazy-loaded below fold (`client:visible`)
- [ ] Contact form: real submission delivered (verify inbox); Turnstile **blocks** a curl'd POST without token; honeypot catches a bot-shaped submission; per-IP cap enforced
- [ ] 404 page renders with working search; robots.txt + sitemap cross-referenced
- [ ] Feature flags: toggling `comments: off` and rebuilding removes giscus script from output HTML (grep proof)

## 3.7 Definition of Done (Phase)

All acceptance boxes ticked · `docs/secrets.md` now has real rows (Turnstile secret, Resend key — both marked "Worker env binding, quarterly rotation") · state matrix table in quality-specs §6 updated to reflect _implemented_ states, not just specified ones · OG generation adds < 60 s to build (recorded).

## 3.8 Exit Gate G3 — Discoverable

| #   | Check                                                                       | Verified by         |
| --- | --------------------------------------------------------------------------- | ------------------- |
| 1   | Search, feed, SEO, OG, comments, form all functional on production          | checklist walk      |
| 2   | Lighthouse SEO = 100 on 3 page classes                                      | recorded runs       |
| 3   | Contact path protected (Turnstile verify proven server-side)                | curl test           |
| 4   | Every feature independently switchable via `site-config.yaml`               | flag-off grep proof |
| 5   | Build pipeline order documented and stable (build → OG → pagefind → deploy) | Pages build log     |

## 3.9 Risks & Rollback

**Resend/OG library churn:** Satori and resvg are pinned exact; a broken OG run must not break the deploy — the script emits the fallback card and logs a warning (site quality > share-card quality). **Rollback:** each feature is a flag; a misbehaving integration is disabled by config, not by revert-scrambling. The Worker has `wrangler rollback` (one command, previous deploy).

**Changelog:** _(record actuals: hours, OG build seconds, form test results)_

---

_Next phase: [`06-phase-4-admin-cms.md`](06-phase-4-admin-cms.md)_
