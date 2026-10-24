# AI Portfolio Website — Production Handbook

## Operations Manual, Owner's Guide & Runbooks — v1.0 (October 2026)

---

## Table of Contents

- [1. Purpose & How to Use This Handbook](#1-purpose--how-to-use-this-handbook)
- [2. System Overview & Principles](#2-system-overview--principles)
- [3. Architecture at a Glance](#3-architecture-at-a-glance)
- [4. Repository Layout](#4-repository-layout)
- [5. Environment Variables & Secrets Reference](#5-environment-variables--secrets-reference)
- [6. Local Development](#6-local-development)
- [7. Content Model Reference](#7-content-model-reference)
- [8. Owner's Admin Guide](#8-owners-admin-guide)
- [9. First-Time Deployment Runbook](#9-first-time-deployment-runbook)
- [10. CI/CD & Automation Reference](#10-cicd--automation-reference)
- [11. Monitoring & Incident Response](#11-monitoring--incident-response)
- [12. Security Checklist & Rotation Calendar](#12-security-checklist--rotation-calendar)
- [13. Testing & QA Gates](#13-testing--qa-gates)
- [14. SEO & Launch Checklist](#14-seo--launch-checklist)
- [15. Backup & Disaster Recovery](#15-backup--disaster-recovery)
- [16. Cost Sheet & Upgrade Triggers](#16-cost-sheet--upgrade-triggers)
- [17. Change Management & Free-Tier Drift Ritual](#17-change-management--free-tier-drift-ritual)
- [18. Troubleshooting FAQ](#18-troubleshooting-faq)

---

## 1. Purpose & How to Use This Handbook

This handbook is the **operations layer** of the portfolio system: it tells the owner-operator how to run, edit, secure, monitor, and recover the site day-to-day, without re-reading the full blueprint. The blueprint (`AI-Portfolio-Website-Blueprint-v4-Research-Upgraded.md`) explains _why_ the system is designed the way it is — strategy, design rationale, and verification evidence; this document assumes those decisions and records _how to operate them_. Where the two disagree after a future edit, the blueprint's change-log tables win, and this handbook should be updated in the same pull request.

Three audiences use this document, and each has a shortest path. **The owner (non-technical moments):** read Section 8 (Owner's Admin Guide) once, and bookmark Section 11 (incident playbooks) for the day something breaks. **The owner (engineering mode) or a future contributor:** Sections 4-7, 9-10, and 12-13 are the working set. **An onboarding reviewer or interviewer:** Sections 2-3 are the honest two-page summary of what this system is and how seriously it is run — treat them as part of the portfolio itself.

Operating conventions used throughout: runbooks are written as numbered, copy-pasteable steps; tables record _authoritative values_ (limits, names, quotas) rather than descriptions of them; and every section ends where its failure mode lives — so if you are debugging rather than reading, follow the failure, not the index.

---

## 2. System Overview & Principles

The system is a **self-updating, AI-assisted personal portfolio**: a statically generated website whose content lives as versioned JSON/YAML/Markdown in a public Git repository, is edited through a browser-based admin panel or by automation jobs, and is rebuilt and served globally for $0/month. It exists to get its owner interviews — every feature (the auto-updating proof-of-work feeds, the "Ask My AI" chatbot that knows the resume, the two-template resume builder with PDF export) is a hiring signal in disguise, and the site's own engineering is the strongest project on display.

Four principles govern every operational decision in this handbook, and any future change should be checked against them:
1. **Static-first.** Every page is prebuilt HTML on a CDN; runtime logic exists only where interactivity demands it (chatbot Worker, contact form, demo inference). Consequence: hosting is free and effectively un-downtimeable at this scale.
2. **Git is the database.** All content and configuration are files; every change is a commit; every publish is a merge. Consequence: full audit history, instant rollback, no database to pay for or lose.
3. **Human-in-the-loop publishing.** Automation and admin-panel edits alike arrive as draft pull requests; nothing reaches production unreviewed. Consequence: the site can never publish a hallucination or a 1 a.m. typo without a deliberate merge.
4. **$0 is a design property, not a discount.** Every service has a verified free tier sized for this workload (verified October 2026), a documented fallback, and an upgrade trigger recorded in Section 16.

The complete stack inventory with verified limits lives in the blueprint's Part 11.2 table; this handbook references those rows rather than duplicating them, and Section 16 carries the operational cost sheet and the conditions under which each tier should be replaced.

---

## 3. Architecture at a Glance

```text
                          ┌──────────────────────────────────────┐
                          │  VISITORS (recruiters, peers, you)   │
                          └──────────────┬───────────────────────┘
                                         ▼
                     https://yourname.pages.dev  (Cloudflare Pages, free)
        ┌──────────────────────┬─────────┴────────────┬─────────────────────┐
        ▼                      ▼                      ▼                     ▼
  Static site (SSG)     Chatbot Worker        Contact form Worker    Static assets
  Astro/Next SSG        → Groq free tier      → Resend free tier     (R2: photos, PDFs)
  zero-JS + islands     → Turnstile + KV      (100 emails/day)       (OG cards, resume PDFs)
  Pagefind search       (10 msgs/IP/day)
        ▲                      ▲
        │                      │ system prompt = resume.json + projects.json
GITHUB REPO                 GROQ FREE TIER
  ├─ content/  (this is "the database")
  ├─ Actions: 6h GitHub/Open Library sync → PR · nightly LLM summaries → PR
  ├─ Actions: weekly heartbeat (keeps cron alive; stamps /now + footer)
  ├─ Actions: resume PDFs (Typst) + OG images (Satori) at build
  └─ CI gates: vitest · playwright · axe · Lighthouse · lychee · schema + contrast
        ▲
        │ draft PRs on every edit
  OWNER ──> /admin (Sveltia CMS, GitHub OAuth + optional Cloudflare Access)
              content collections · page/site singletons · theme tokens · SEO · chatbot
```

The three data flows to internalize before operating anything: **(1) Owner edits** go admin-panel → draft PR → merge → Cloudflare Pages rebuild → live in roughly one to three minutes. **(2) Automation edits** go scheduled GitHub Action → fetch/generate → draft PR → _your_ merge → rebuild; automation can never publish alone. **(3) Visitor inputs** (chat, contact form) go browser → Cloudflare Worker (rate limit, bot check) → provider (Groq/Resend) and never expose a key, because keys exist only as Worker/Actions secrets.

---

## 4. Repository Layout

The tree below is the contract between content, code, and automation. Every file is either **owner-authored** (you, via admin panel or git), **automation-authored** (a scheduled workflow), or **generated** (build output, never edited). The `CI guard` column in Section 7 depends on this classification staying true.

```text
portfolio/
├── admin/                          # Sveltia CMS (static page + config)
│   ├── index.html
│   └── config.yml                  # collections + singletons definitions
├── content/                        # ← THE DATABASE (all editable state)
│   ├── projects.json               #   automation (6h GitHub sync)
│   ├── activity.json               #   automation (GitHub events)
│   ├── project-overrides.yaml      #   owner — featured/hidden/rewritten (override wins)
│   ├── reading-list.yaml           #   owner — books
│   ├── anime.yaml                  #   owner — anime
│   ├── gallery-manifest.yaml       #   owner + build (EXIF pipeline)
│   ├── experience.yaml             #   owner — certifications/courses (no API exists)
│   ├── resume.json                 #   owner — JSON Resume schema (Part 13)
│   ├── resume-config.yaml          #   owner — template switch (standard/europass)
│   ├── site-config.yaml            #   owner — availability, socials, footer, feature flags
│   ├── navigation.yaml             #   owner — menu order/labels/visibility
│   ├── seo.yaml                    #   owner — per-page title/description overrides
│   ├── chatbot-config.yaml         #   owner — greeting, suggestions, kill-switch
│   ├── theme.yaml                  #   owner — design tokens (colors/radii/motion)
│   ├── pages/                      #   owner — per-page copy (home, about, projects, lab…)
│   ├── notes/*.md                  #   owner — learning notes
│   └── blog/*.md                   #   owner — posts (frontmatter: title/date/category/tags/draft)
├── src/                            # site code (components consume content/ — "nothing hard-coded")
│   ├── components/
│   ├── layouts/
│   ├── styles/                     # tokens.css consumes theme.yaml at build
│   └── pages/                      # file-based routes incl. /now, /resume, /admin redirect
├── functions/ or workers/          # chatbot + contact Workers (keys via bindings only)
├── resume-templates/               # standard.typ + europass.typ (Typst), JSON Resume mapper
├── scripts/                        # build-time: og-images.mjs, contrast-check.mjs, exif.mjs
└── .github/workflows/              # sync.yml · summaries.yml · heartbeat.yml · resume-pdf.yml · ci.yml
```

Two conventions keep this layout healthy as it evolves. First, **adding an editable thing = adding a file + a schema + an admin collection**, in that order — a change that touches all three is a routine pull request; one that touches only components is a smell (a hard-coded string). Second, **generated files are never committed** except the deliberate build artifacts (OG cards, resume PDFs) chosen in the blueprint; if you find yourself hand-editing `projects.json`, stop — edit `project-overrides.yaml` instead, because the next sync run will overwrite whatever you typed.

---

## 5. Environment Variables & Secrets Reference

Secrets live in exactly two places — **Cloudflare Pages/Workers environment bindings** (for runtime: chatbot, contact form) and **GitHub Actions secrets** (for build-time jobs) — and nowhere else: not in the repo, not in the browser bundle, not in the admin config. The table is the authoritative inventory; quarterly rotation is scheduled in Section 12.

| Secret / binding                 | Service                  | Where it lives                                                                       | Used by                         | Rotation                   |
| -------------------------------- | ------------------------ | ------------------------------------------------------------------------------------ | ------------------------------- | -------------------------- |
| `GROQ_API_KEY`                   | Groq                     | Worker binding (encrypted)                                                           | Chatbot inference               | Quarterly                  |
| `GITHUB_TOKEN`                   | GitHub                   | Actions secret (fine-grained PAT, **read-only**, scoped to this repo, expiry ≤ 1 yr) | 6h sync, heartbeat              | Yearly (expiry enforced)   |
| `OPENLIBRARY_*`                  | Open Library             | none — keyless API                                                                   | Book covers/metadata            | n/a                        |
| `RESEND_API_KEY`                 | Resend                   | Worker binding                                                                       | Contact form email              | Quarterly                  |
| `CF_ACCOUNT_ID` / `CF_API_TOKEN` | Cloudflare R2/Workers AI | Actions secret (least-privilege token)                                               | R2 photo sync, Workers AI demos | Quarterly                  |
| `TURNSTILE_SECRET`               | Cloudflare Turnstile     | Worker binding                                                                       | Bot checks (chat + form)        | On rotation days           |
| `OAUTH_CLIENT_ID/SECRET`         | GitHub OAuth app         | Pages env (encrypted)                                                                | Admin panel login               | Quarterly                  |
| `CHATBOT_KILL_SWITCH`            | self                     | Worker env flag                                                                      | Instant chatbot off             | — (a switch, not a secret) |

Operational rules this table enforces: **one key per service** (a leak is scoped and rotatable); **least privilege always** (the GitHub PAT can read this repo and nothing else — write access would let a leaked token push code); and **the kill switch is the first thing to touch in any AI-related incident** (Section 11, playbook P3), because it works even when every other diagnostic tool is on fire.

---

## 6. Local Development

Local development exists for engineering changes — content and configuration are normally edited in the admin panel (Section 8), and the build pipeline is exercised by CI. You need Node 20+ (22+ if Next.js), pnpm/npm, the Typst CLI only when touching resume templates, and Python 3.11+ only for build scripts. One-time setup is three commands after cloning: `npm install`, then `npm run dev` serves the site with content hot-reloaded from `content/`, and `npm run cms` opens the local CMS against the local repo (Sveltia's local workflow needs no proxy server).

Before pushing any engineering change, run the same gates CI will run, because the discipline that keeps full-site-editing safe (blueprint Part 14.8) applies to your own edits: `npm run lint` (nothing hard-coded slipped in), `npm run schema` (every content file validates against its JSON schema), `npm run contrast` (theme tokens still pass WCAG AA pairs), `npm run test` (Vitest units + the Playwright smoke suite, which drives the chatbot UI, the resume template toggle, and the admin login flow against a local fixture repo), and `npm run build` (a clean build with Pagefind indexing and OG generation is the binary "is the site intact" oracle).

Two common local-development surprises have documented answers. **The sync data is stale locally** — `content/projects.json` is committed as the last-known-good snapshot, so local work always renders realistic data without network calls; to refresh, run `npm run sync -- --dry` which performs the fetch and prints the diff without committing. **The admin panel looks empty locally** — the CMS reads the repo through GitHub in production, so use `npm run cms` (local workflow mode) rather than the production `/admin` when developing new collections.

---

## 7. Content Model Reference

This is the master registry of every content file: what it holds, who writes it, and which CI guard protects it. When adding a new editable thing, add its row here in the same PR. The "Author" column distinguishes **owner** (you, via CMS or git), **automation** (scheduled workflow), and **build** (derived at build time and never hand-edited).

| File                              | Format   | Holds                                                                   | Author          | CI guard                                       |
| --------------------------------- | -------- | ----------------------------------------------------------------------- | --------------- | ---------------------------------------------- |
| `content/projects.json`           | JSON     | Synced GitHub repo facts                                                | Automation (6h) | Schema; read-only in CMS                       |
| `content/activity.json`           | JSON     | Commits/releases feed                                                   | Automation (6h) | Schema; read-only in CMS                       |
| `content/project-overrides.yaml`  | YAML     | featured/hidden/rewritten narrative                                     | Owner           | Schema; merge test (override wins)             |
| `content/reading-list.yaml`       | YAML     | Books: title/author/status/rating/review/cover                          | Owner           | Schema; cover URL link-check                   |
| `content/anime.yaml`              | YAML     | Anime: title/studio/year/status/rating/thoughts                         | Owner           | Schema                                         |
| `content/gallery-manifest.yaml`   | YAML     | Photos + EXIF + collections                                             | Owner + build   | Schema; EXIF parse test                        |
| `content/experience.yaml`         | YAML     | Certifications/courses (manual — no API exists)                         | Owner           | Schema                                         |
| `content/resume.json`             | JSON     | JSON Resume: basics/work/education/skills/projects/certs                | Owner           | JSON Resume schema validator                   |
| `content/resume-config.yaml`      | YAML     | active template, visitor toggle, Europass options                       | Owner           | Enum schema (standard/europass)                |
| `content/site-config.yaml`        | YAML     | availability, socials, footer, feature flags (search/comments/feed/now) | Owner           | Schema; feature-flag enum                      |
| `content/navigation.yaml`         | YAML     | menu entries: label/url/visible/order                                   | Owner           | Schema; URL must resolve to a route            |
| `content/seo.yaml`                | YAML     | per-page title/description overrides, default OG image                  | Owner           | Schema; length limits (title ≤ 60, desc ≤ 155) |
| `content/chatbot-config.yaml`     | YAML     | greeting, suggested questions, limit notice, kill-switch                | Owner           | Schema                                         |
| `content/theme.yaml`              | YAML     | design tokens (colors/radii/spacing/type scale/motion)                  | Owner           | Schema + **contrast gate**                     |
| `content/pages/*.yaml`            | YAML     | per-page copy (hero, CTAs, intros, empty-state texts)                   | Owner           | Schema; string-length budgets                  |
| `content/blog/*.md`               | Markdown | posts (frontmatter: title/date/category/tags/draft)                     | Owner           | Frontmatter schema; lychee link check          |
| `content/notes/*.md`              | Markdown | learning notes (frontmatter + status: seedling/evergreen)               | Owner           | Frontmatter schema                             |
| `public/og/*.png`, `resume/*.pdf` | binary   | OG cards, resume PDFs                                                   | Build           | Regenerated every build; never edit            |

The registry encodes the site's two safety stories. **Owner files are schema-guarded, not trust-guarded** — the admin panel's forms make valid input easy, and CI's validation makes invalid input impossible to merge, which together are what license the "edit everything" scope of Part 14. **Automation files are fenced off** — marked read-only in the CMS and overwritten on schedule by design, with the override layer (`project-overrides.yaml`) as the only sanctioned way for human intent to shape machine-synced data.

---

## 8. Owner's Admin Guide

This section is the daily-driver documentation: how to log in, and how to do every routine task from the browser, most of them from a phone. **Login:** visit `https://yourname.pages.dev/admin`, complete the Cloudflare Access email code (if enabled), then "Log in with GitHub" using the account that owns the repo. **The golden rule:** every save creates a draft PR — click **Save**, open the PR link, glance at the diff and the deploy preview, press **Merge**; the site updates in one to three minutes. Nothing you save is live until you merge, and nothing you merge is scary, because every merge can be reverted (Section 11, playbook P2).

Everyday tasks, in the vocabulary the CMS sidebar actually uses:

| I want to…                  | Open this collection | Do this                                                                                                                |
| --------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Add a finished book         | Books                | Add row → title, author, status "finished", rating, one-line review → Save → Merge                                     |
| Update anime list           | Anime                | Add/edit row → status/rating → Save → Merge                                                                            |
| Publish photos              | Photos               | Drag-drop files (auto-WebP) → assign collection → Save → Merge; EXIF captions fill automatically                       |
| Capture what I learned      | Learning Notes       | New note → title, author, tags, status → write markdown → Save → Merge (drafts auto-backup)                            |
| Write a post                | Blog                 | New post → category/tags → write → keep `draft: true` until ready → Save → Merge to preview, flip draft off to publish |
| Change the headline/tagline | Home Page            | Edit strings → Save → Merge                                                                                            |
| Reorder or hide a menu item | Navigation           | Drag to reorder / toggle visible → Save → Merge                                                                        |
| Retheme the site            | Theme                | Colors/radius/motion from pickers — a contrast failure names the exact pair to fix                                     |
| Switch resume template      | Site Settings        | `active: standard ↔ europass` (or enable the visitor toggle) → Save → Merge — PDFs regenerate on next build            |
| Edit resume content         | Resume               | Form fields (experience/education/skills/projects) → Save → Merge                                                      |
| Turn the chatbot off/on     | Chatbot              | Kill-switch toggle → Save → Merge (instant effect at next build; Worker flag flips the moment it deploys)              |
| Update "what I'm doing now" | Now Page             | Edit the short list + it re-stamps the date on merge                                                                   |
| Pin my best project         | Project Overrides    | Pick project → mark featured, rewrite description → Save → Merge                                                       |

**What NOT to touch from the panel** — automation-owned files (`Projects sync`, `Activity`) are marked read-only and appear greyed out; use Project Overrides for narrative changes instead. **Emergency off-switches** live in one place: Chatbot kill-switch, `search/comments` feature flags in Site Settings, and "hide" toggles in Navigation — any of which is a 30-second phone edit that merges without breaking anything else. **If the panel itself is down**, the fallback is always the same: the site is just files — edit `content/*.yaml` directly on github.com (even the mobile web UI works), open the PR, merge; Section 11's playbooks cover the rare cases where the problem is upstream of the panel.

---

## 9. First-Time Deployment Runbook

One-time setup, in dependency order. Prerequisites: a GitHub account, a Cloudflare account (free plan), a Groq account (free console key), a Resend account (free tier), and the repository pushed to GitHub. Budget ~3 hours; every step is free.
1. **Cloudflare Pages connect** — Pages → Create project → Connect to Git → select the repo. Build settings: framework preset `Astro` (or `Next.js`), build command `npm run build`, output `dist`. Save; the first deploy proves the pipeline end-to-end.
2. **Workers + bindings** — deploy the two Workers (chatbot, contact) from `workers/`; add bindings: `GROQ_API_KEY`, `RESEND_API_KEY`, `TURNSTILE_SECRET`, KV namespace `rate-limit`; set `CHATBOT_KILL_SWITCH=false`.
3. **KV + Turnstile + R2** — create the KV namespace (free), a Turnstile widget for `yourname.pages.dev` (free, unlimited), and the `portfolio-media` R2 bucket (10 GB free); note the Sveltia R2 keys into Pages env (Section 5 rows).
4. **GitHub Actions secrets** — add `GITHUB_TOKEN` (fine-grained PAT: read-only, this repo only, 1-year expiry), `CF_ACCOUNT_ID`, `CF_API_TOKEN` (least-privilege). Enable workflows; run `sync.yml` manually once to seed `projects.json`/`activity.json`.
5. **Admin panel** — create the GitHub OAuth app (callback `https://yourname.pages.dev/admin`), put ID/secret into Pages env; commit `admin/` if not present. Optional but recommended: Zero Trust → add self-hosted app for `/admin*` with owner-email OTP (free; note: card on file required at signup).
6. **CI gates** — confirm `ci.yml` is green on the main branch; branch protection: require the CI check + 1 review (you) before merge — this is the human-in-the-loop guarantee made mechanical.
7. **Resume PDFs + OG images** — trigger `resume-pdf.yml` once; verify `resume/*.pdf` and `public/og/*.png` artifacts render and are linked from the site.
8. **Monitoring** — UptimeRobot: monitors for `/` and `/api/chat` (5-min checks); Sentry: DSN into the Workers; Cloudflare Web Analytics: enable in Pages settings.
9. **SEO claim** — Google Search Console + Bing Webmaster: verify the domain, submit `sitemap.xml` (blueprint Part 10.2 checklist).
10. **Smoke test the whole loop** — add a book from the phone → PR → merge → see it on the site → ask the chatbot about it. The site is in production the day this loop passes.

Rollback of the deployment itself is rarely needed (Pages keeps every deploy; "Rollback" button reverts to the previous build instantly). The deeper runbook for partial failures is Section 11.

---

## 10. CI/CD & Automation Reference

Five scheduled/triggered workflows plus the CI gate constitute the automation. All run free on the public repo; all publish via draft PR except CI itself.

| Workflow         | Schedule / trigger                                   | Does                                                                                                   | Publishes via                                  | Failure mode → response                                        |
| ---------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------- | -------------------------------------------------------------- |
| `sync.yml`       | cron `0 */6 * * *`                                   | GitHub GraphQL + Open Library → `projects.json`, `activity.json`; commit                               | Draft PR (auto-mergeable if diff is pure data) | Rate-limit/backoff (Part 9.5); stale snapshot keeps site up    |
| `summaries.yml`  | nightly                                              | Groq writes blog drafts / project summaries                                                            | **Draft PR — never auto-merged**               | LLM errors → skip run, logged in Actions summary               |
| `heartbeat.yml`  | weekly                                               | Commit `last-updated` stamp (keeps cron alive past GitHub's 60-day disable; re-stamps `/now` + footer) | Direct commit to main                          | Skipped weeks are harmless; watch for drift in the footer date |
| `resume-pdf.yml` | on merge touching `resume.json`/`resume-config.yaml` | JSON Resume → Typst → standard + Europass PDFs; OG cards via Satori                                    | Build artifacts committed                      | Typst error → PR check fails loudly before merge               |
| `ci.yml`         | every PR + main push                                 | lint, schema validation, contrast gate, vitest, Playwright smoke, axe, Lighthouse budget, lychee links | PR status checks (required)                    | Red check blocks merge — that is the system working            |

Operational notes that prevent familiar footguns: **cron drift is expected** (GitHub schedules are best-effort; the heartbeat makes the evidence visible rather than assumed); **the 60-day auto-disable is designed around** — any commit, including the heartbeat, resets the clock, and the "Last auto-updated" footer is the tell that it stopped; and **every automation is additive** — the worst case of any workflow failing is a stale snapshot with an honest timestamp, never a broken site, which is the graceful-degradation contract from blueprint Part 9.5.

---

## 11. Monitoring & Incident Response

Signals you receive: **UptimeRobot** emails on 5-minute checks failing (site-level), **Sentry** groups Worker errors with stack traces (code-level), **Actions email** on workflow failure (pipeline-level), and **Cloudflare Web Analytics + Search Console** for slow-burn trends (product-level). Triage is severity-first: is the site down (P1), is publishing broken (P2), is a free tier exhausted (P3), is one data source stale (P4), or is it abuse/spam (P5). The playbooks below are the first response for each; the golden rule is that the kill-switches exist so that no incident requires heroics at 2 a.m.

| #      | Symptom                                  | Likely cause                                    | Playbook                                                                                                                                                                                                     |
| ------ | ---------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **P1** | UptimeRobot: site down                   | Pages build red, or platform issue              | Check Pages latest deploy → if red, hit **Rollback** to last good → fix forward calmly; if deploy list is fine, check Cloudflare status page; escalate = none (CDN outages are brief)                        |
| **P2** | Merge didn't change the site / build red | Schema or CI gate failed                        | Read the failed check (it names the file and rule) → fix in CMS or git → re-merge; last resort: `git revert` the offending merge — site returns to previous state in ~2 min                                  |
| **P3** | Chatbot 429s / "AI is resting" banner on | Groq quota (RPD/TPD) or abuse                   | Flip `CHATBOT_KILL_SWITCH=true` if abusive; check Sentry for traffic shape; Turnstile failures? re-verify widget; quota resets daily UTC — plan the Workers AI fallback (blueprint 11.3) if it recurs weekly |
| **P4** | Activity feed / books stale              | Sync workflow failed (token expiry, API change) | Actions → read failure → most common: PAT expired (Section 12 calendar) → rotate secret → re-run workflow; site shows honest "last synced" meanwhile                                                         |
| **P5** | Form spam / comment noise                | Bots past Turnstile, or giscus moderation queue | Close contact Worker rate window (KV limit down to 5/day); giscus: moderate in GitHub Discussions (hide/comment lock) — no site action needed                                                                |

After any P1/P2: write a five-line postmortem in the repo (`docs/incidents/YYYY-MM-DD.md`) — symptom, cause, fix, time-to-recover, and what the playbook missed. The postmortem folder is itself a hiring artifact: it demonstrates SRE-grade operational maturity from a one-person site, which is precisely the sort of quiet proof this portfolio exists to make.

---

## 12. Security Checklist & Rotation Calendar

The site's threat model is small but real: key leakage (costs money or enables abuse), content tampering (reputation damage on a resume-adjacent site), and quota abuse (free-tier burn). The controls, in priority order: secrets only in encrypted bindings/Actions secrets (Section 5); least-privilege short-lived tokens; Turnstile on every public input; per-IP rate limits in the Worker; security headers via `_headers` (CSP with nonced inline scripts, HSTS, X-Content-Type-Options, Referrer-Policy); Dependabot alerts on; Actions pinned to commit SHAs; branch protection requiring CI + review; and two independent locks on `/admin` (GitHub OAuth, optionally Cloudflare Access). Full rationale lives in blueprint Part 10.1; this section is the calendar that keeps it true.

| Cadence                                         | Action                                                                                                                                                                   |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Quarterly (first Saturday)                      | Rotate `GROQ_API_KEY`, `RESEND_API_KEY`, `CF_API_TOKEN`, `TURNSTILE_SECRET`, OAuth secret (15 min total); scan Dependabot alerts; review Sentry for unusual error shapes |
| Yearly (PAT expiry week)                        | Re-issue the fine-grained GitHub PAT (read-only, this repo, 1 yr) — the expiry email is the reminder                                                                     |
| Monthly (with analytics ritual, blueprint 15.9) | Glance at Groq usage (quota shape ≈ visitor volume?), R2 bytes (10 GB ceiling), Actions minutes                                                                          |
| On any secret suspicion                         | Rotate that key immediately; check Provider logs for anomalous usage; consider kill-switch while rotating — rotation takes minutes and is always the cheap option        |

---

## 13. Testing & QA Gates

What each gate protects, in one line each: **schema validation** — no malformed content can merge (the full-site-editing license, Part 14.8); **contrast gate** — no inaccessible palette can merge (theme tokens are editable, accessibility is not); **vitest** — pure logic (merge rules, resume mappers, slug/SEO builders) stays correct; **Playwright smoke** — the three journeys that must never break (chat round-trip on fixtures, resume template toggle + PDF links, admin login → save → PR); **axe** — WCAG 2.2 AA regressions (keyboard traps, contrast, labels) fail the PR; **Lighthouse CI** — budgets hold (LCP < 2.0s, CLS < 0.1, INP < 200ms, JS ≤ 60 KB gz worst-page); **lychee** — no dead links ship, including book covers and outbound profiles.

Run them locally with `npm run test` and `npm run ci` (the composite), but the enforcement point is branch protection: CI is a **required check**, so a red gate blocks merge mechanically — the human-in-the-loop pattern works only if the loop has a bouncer. New engineering work must extend the gates, not route around them: a new interactive surface ships with a state matrix (blueprint 15.6), an axe-clean keyboard path, and a smoke step, in the same PR — that rule is what keeps "every merge is safe" true six months from now.

---

## 14. SEO & Launch Checklist

Technical SEO is mostly pre-built (static HTML, sitemap, robots, canonical URLs, Person + Article JSON-LD, per-page OG cards); the checklist below is what remains genuinely manual, at launch and after meaningful content changes.
- [ ] Search Console + Bing Webmaster verified; `sitemap.xml` submitted; URL inspection passes on `/`, `/resume`, one blog post
- [ ] Rich Results test: Person (home) and BlogPosting (post) both valid
- [ ] Every page: unique title (≤ 60 chars) + description (≤ 155) — defaults from `seo.yaml`, overrides where needed
- [ ] Share-test the top five URLs (LinkedIn, Slack, X): OG card renders with the generated image on each
- [ ] `robots.txt` excludes `/admin`; the admin URL is not linked anywhere public
- [ ] Custom domain decision made (default honest answer: `pages.dev` is fine — blueprint 11.7); if bought: at-cost via Cloudflare, then 301s + Search Console change-of-address
- [ ] After each meaningful post: internal-link it from one older post, and check impressions/clicks in the monthly ritual (blueprint 15.9)

---

## 15. Backup & Disaster Recovery

The uncomfortable truth in your favor: **the git repository is the backup**. Content, configuration, admin definitions, templates, and workflow definitions are all commits on GitHub (which itself is redundantly replicated); photos and PDFs live in R2; no other state exists anywhere — there is no database to dump because there is no database. The recovery point objective is therefore "last merged commit," and the recovery procedure for total loss (account compromise, accidental repo deletion) is: restore the repo from a clone, re-connect Cloudflare Pages, re-enter secrets (Section 5 table is the checklist), redeploy — about an hour, end to end.

The drill that turns this theory into practice, run **twice a year**: (1) `git clone --mirror` the repo to a second host (another forge, or a private mirror repo) and re-add as a Pages project on a test subdomain — proves the clone is complete; (2) export R2 (`rclone sync r2:portfolio-media ./media-backup/`) and re-upload a sample — proves media is restorable; (3) time the whole exercise. One hour, twice a year, buys the ability to say honestly in an interview: "I run disaster-recovery drills on my own portfolio" — which is both true and exactly the kind of sentence this site exists to earn.

---

## 16. Cost Sheet & Upgrade Triggers

Monthly base cost is **$0**, with one optional line (a custom domain at ~$10-12/year when you want it). The operational view of the free tiers — what to watch, and what to do when a limit becomes real — is the table below (verified figures and rationale: blueprint Part 11).

| Service                                            | Watch                   | Free headroom at this scale                     | Upgrade trigger → action                                                |
| -------------------------------------------------- | ----------------------- | ----------------------------------------------- | ----------------------------------------------------------------------- |
| Cloudflare Pages                                   | builds/month (500)      | ~30 builds/day headroom — effectively unbounded | Never, at portfolio scale                                               |
| Cloudflare Workers                                 | 100k req/day            | Chat+form ≈ tens/day                            | Visitor abuse → tighten limits, not plans                               |
| Groq (chatbot)                                     | 14,400 RPD / 500k TPD   | ~10 msgs/visitor/day budgeted                   | Quality complaints → paid frontier model behind same Worker (~$5-15/mo) |
| R2                                                 | 10 GB                   | Photos are MBs after WebP                       | Gallery reaches ~9 GB → cull or Cloudinary fallback                     |
| Resend                                             | 100/day, 3k/mo          | Contact form ≈ single digits                    | Spam spike → rate-limit harder (P5)                                     |
| GitHub Actions                                     | unlimited (public repo) | Minutes are a non-issue                         | Repo goes private → switch scheduler to Cloudflare Cron Triggers        |
| UptimeRobot / Sentry / giscus / Pagefind / Sveltia | —                       | Sized for far larger sites                      | —                                                                       |

The meta-rule from the blueprint holds operationally: **spend when a measured limit is reached, never preemptively** — and because every layer has a swap-in-place fallback (change a base URL, swap a bucket), no upgrade has ever required re-architecting. That property is the $0 stack's real payoff: it converts "we can't afford it" from an architecture risk into a two-line change.

---

## 17. Change Management & Free-Tier Drift Ritual

Free tiers and APIs drift — three services this blueprint relied on changed terms between 2020 and 2026, which is why drift management is a scheduled ritual, not a hope. **Quarterly verification hour** (pair it with the key-rotation Saturday): walk the blueprint's integration matrix (Part 9.2) and the stack table (11.2) top to bottom, re-reading each provider's limits page; any changed number gets corrected in the blueprint (verdict-table row) and this handbook (Section 16) in the same sitting. This is the single highest-leverage hour in the operating calendar: it is how the system avoids the death-by-rot that kills most personal automation projects.

Content-schema evolution follows the same discipline at smaller scale: adding a field = schema + CMS config + a default for existing entries, in one PR (old content must never render broken); renaming or removing a field = deprecate first (accept both for one release), migrate, then remove; automation-written files change only in the workflow that writes them. And every structural change to the system — new workflow, new provider, new collection — ships with its handbook row (Sections 7, 10, or 16) updated in the same PR, because documentation that lags reality is the first step back to an unmaintainable site.

---

## 18. Troubleshooting FAQ

**The admin panel won't load.** Check in order: Cloudflare Access prompt (own email allowed?), OAuth callback URL still matches `/admin`, browser popup blocker, GitHub App authorization not revoked. Fallback that always works: edit the content file directly on github.com and merge the PR by hand.

**Saved an edit, merged, site didn't change.** Pages build probably hasn't finished (~1-3 min); then hard-refresh (CDN + browser cache). If the build is red, it's a schema/CI failure — the check names the file (P2 playbook).

**Chatbot says it's resting.** Quota exhausted or kill-switch on. Check `CHATBOT_KILL_SWITCH` in Chatbot collection and Worker logs; quota resets daily UTC; recurring exhaustion = move to Workers AI fallback or reconsider the per-IP limit.

**Book covers missing.** Open Library is keyless but rate-limited (100 req/5 min) — covers fetch at build and cache forever; a 404 ISBN means the entry needs a correct ISBN/OL-ID; the link check in CI names the offender.

**Resume PDF is stale.** PDFs regenerate on merges touching `resume.json`/`resume-config.yaml`; if you edited via a merge that didn't trigger `resume-pdf.yml`, run the workflow manually from the Actions tab.

**Photos look soft or huge.** Uploads are auto-WebP'd at admin time; originals above ~4000px should be resized before upload — R2 stores what you send, and the 10 GB ceiling is the only hard reason to care.

**Search returns nothing.** Pagefind indexes the built site — results exist only after a successful build; empty on a fresh deploy usually means the build's index step was skipped or `/admin` wasn't excluded; run `npm run build` locally and confirm `dist/pagefind/` exists.

**Cron stopped running.** GitHub disables schedules after 60 days without repo activity — the weekly heartbeat exists to prevent exactly this; check the footer's "Last auto-updated" stamp (it is the heartbeat's public face) and the Actions tab for the last `heartbeat.yml` run.

**A free tier changed its terms.** You followed Section 17's ritual, so this is a correction, not an emergency: update the two tables (blueprint verdicts + handbook cost sheet), switch to the documented fallback layer, move on — the architecture was designed so that no provider is load-bearing without an exit.
