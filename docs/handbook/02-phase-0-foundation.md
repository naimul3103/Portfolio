# Phase 0 — Foundation & Environments

> **Status:** NOT STARTED · **Depends on:** — · **Effort:** 6–8 h (1 week) · **Exit gate:** G0
> **Spec references:** [`11-tech-specs.md`](11-tech-specs.md) §1 (stack), §2 (repo layout), §9 (CI/CD), §10 (secrets) · Blueprint v4 Part 11 ($0 stack)

---

## 0.1 Objectives

Stand up the delivery machinery before any product code exists: a public GitHub repository, local tooling with enforced standards, a CI pipeline that fails bad code, and a live deployment target. The phase's deliverable is deliberately unglamorous — by the end of the week, `https://<name>.pages.dev` must serve a generated "hello" page built by CI and deployed automatically. This is the "deploy on day one" discipline: every later phase inherits a working pipeline instead of deferring integration risk to a big-bang deploy at the end. It also front-loads all account/identity setup (GitHub, Cloudflare) so third-party latency never blocks a coding session later.

## 0.2 Scope

| In scope                                                                                            | Out of scope (goes to)                                             |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Accounts: GitHub (public repo), Cloudflare (Pages + Workers + R2 enabled)                           | Custom domain (P8 decides; `pages.dev` is fine)                    |
| Tooling: Node LTS, pnpm, Biome, editor/VS Code settings                                             | Any design decision (P1)                                           |
| Astro 5 + Tailwind 4 scaffold, committed to `main`                                                  | Any content or pages beyond the scaffold (P1/P2)                   |
| CI workflow `ci.yml` (lint, check, build) + branch protection                                       | Test suites beyond the scaffold smoke (P2/P7)                      |
| Cloudflare Pages project wired via **native Git integration**                                       | Chatbot Worker (P6)                                                |
| Repo standards: README, CONTRIBUTING, license, PR/issue templates, labels, milestones, `backlog.md` | OAuth apps / R2 bucket creation (P4 — done there, documented here) |
| Secrets vault doc: a table of every secret this project will ever hold (empty for now)              | Secrets themselves (created in P4/P6 when first needed)            |

## 0.3 Prerequisites (Entry Criteria)

- A GitHub account (2FA enabled — required for branch protection anyway).
- A Cloudflare account (free plan; **no credit card needed** for Pages/Workers/R2 free tiers — Workers paid-plan prompts can be declined).
- Node.js ≥ 22 LTS installed locally; git ≥ 2.40 with per-repo config set (`user.name`, `user.email`).

## 0.4 Task Breakdown

| ID    | Task                                                           | Details / spec ref                                                                                                                                                                                                                                           | Est   | Depends |
| ----- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----- | ------- |
| P0-01 | Create public GitHub repo `yourname/portfolio`                 | Public = free unlimited Actions minutes (Blueprint 11.2) + required later by giscus (P3). Initialize with `README.md`, `LICENSE` (MIT — check employer/school constraints), `.gitignore`                                                                     | 0.5 h | —       |
| P0-02 | Install toolchain & pin versions                               | Node ≥ 22 LTS (`.nvmrc`), pnpm ≥ 10 (`packageManager` field), Biome ≥ 2 (`biome.json` with recommended rules + format config). Document in README "Prerequisites"                                                                                            | 1 h   | P0-01   |
| P0-03 | Scaffold Astro 5 + Tailwind 4                                  | `pnpm create astro@latest` → minimal template; add `@tailwindcss/vite` plugin + `@astrojs/check`; empty `src/pages/index.astro` that renders name + role from `content/site-config.yaml` placeholder (first "config-as-content" seed, per Blueprint Part 14) | 1.5 h | P0-02   |
| P0-04 | Write repo standards                                           | `CONTRIBUTING.md` (branch/commit/PR rules from execution plan §1.7), `.editorconfig`, `.github/PULL_REQUEST_TEMPLATE.md` (a11y + perf checklists), issue templates (task/bug), `backlog.md`                                                                  | 1.5 h | P0-01   |
| P0-05 | Create labels + 9 GitHub Milestones                            | Labels: `p0`–`p8`, `a11y`, `perf`, `security`, `content`, `chore`. Milestones named `P0 Foundation` … `P8 Launch`                                                                                                                                            | 0.5 h | P0-01   |
| P0-06 | Author CI workflow `.github/workflows/ci.yml`                  | Steps: checkout → pnpm setup (cache) → `pnpm install --frozen-lockfile` → `biome check` → `astro check` → `astro build` → upload `dist/` artifact. Trigger: `pull_request` + `push: main`. Full YAML in `11-tech-specs.md` §9.1                              | 1.5 h | P0-03   |
| P0-07 | Enable branch protection on `main`                             | Require `ci` status check, require PRs (no direct pushes), include administrators. Add `CODEOWNERS` (`* @yourname`)                                                                                                                                          | 0.5 h | P0-06   |
| P0-08 | Create Cloudflare Pages project via **native Git integration** | Connect repo, framework preset "Astro", build command `pnpm build`, output `dist`, production branch `main`. **Do not** use the wrangler/pages-action deploy path — native integration gives per-PR preview URLs for free and consumes zero Actions minutes  | 1 h   | P0-03   |
| P0-09 | Smoke-test the full loop                                       | Open a PR changing the index page → CI green → **preview URL** renders change → merge → production `*.pages.dev` updates. Screenshot both URLs into the PR                                                                                                   | 1 h   | P0-08   |
| P0-10 | Create secrets registry (empty) + `backlog.md` seeded          | `docs/secrets.md`: table with columns Name / Service / Stored in / Rotation / Created (Blueprint 10.1 rule: keys never in repo). All rows created later with the phase that needs them                                                                       | 0.5 h | P0-04   |

## 0.5 Implementation Notes

**Why native Git integration instead of Actions-based deploys.** Cloudflare Pages' Git integration builds on every push and publishes a per-branch preview automatically. An Actions-based deploy (wrangler-action/pages-action) would duplicate this while burning Actions minutes on private-repo fallback scenarios. The split used throughout this handbook: **Pages Git integration owns _deployment_, GitHub Actions own _verification_** (CI gates, automation cron jobs, PDF builds). The one exception is the chatbot Worker (P6), which deploys separately via `wrangler`.

**Version pinning policy.** `package.json` pins exact versions for runtime-shaping deps (Astro, Sveltia CMS later, Typst in CI); caret ranges are acceptable for dev tooling. The lockfile is committed; CI installs with `--frozen-lockfile`. When Sveltia is added in P4 it is pinned exact because it is pre-1.0 (risk R3).

**The `pages.dev` name is load-bearing.** `<name>.pages.dev` appears in OAuth callback URLs (P4), the Person JSON-LD block (P3), and Search Console (P7/P8). Choose it once, treat it as semi-permanent; a custom domain in P8 layers on top rather than replacing it.

## 0.6 Acceptance Criteria

- [ ] `https://<name>.pages.dev` serves the scaffold page generated by CI (not a manual `wrangler` push)
- [ ] A test PR produced a working preview URL; the merged change appeared on production without manual steps
- [ ] Pushing a deliberately broken commit (syntax error) to a branch makes CI fail — **the gate actually gates**
- [ ] `main` protected: direct push rejected; PR without green `ci` cannot merge
- [ ] `pnpm biome check` and `astro check` both pass locally and in CI
- [ ] Labels `p0`–`p8` and 9 milestones exist; `backlog.md` exists with at least one captured "later" idea
- [ ] `docs/secrets.md` exists with the table structure and zero filled rows

## 0.7 Definition of Done (Phase)

All acceptance boxes ticked · CI end-to-end verified with both a passing and a failing PR · README documents local setup such that a fresh clone reaches `pnpm dev` in ≤ 5 minutes · execution plan risk register reviewed once (no new risks found).

## 0.8 Exit Gate G0 — Skeleton Live

| #   | Check                                                                         | Verified by                                          |
| --- | ----------------------------------------------------------------------------- | ---------------------------------------------------- |
| 1   | Production URL serves CI-built scaffold                                       | curl / browser check                                 |
| 2   | Branch protection blocks unprotected `main` pushes                            | attempt + GitHub API `GET /branches/main/protection` |
| 3   | Preview URL workflow demonstrated                                             | link in merged PR                                    |
| 4   | Repo standards complete (templates, labels, milestones, backlog, secrets doc) | checklist in `docs/README`                           |

## 0.9 Risks & Rollback

**Risk carried forward:** none for R1–R10, but note the Pages project name choice (0.5) — renaming later requires a new Pages project and DNS/OAuth updates; pick deliberately now. **Rollback:** the entire phase is reversible by deleting the Pages project and repo; nothing here touches production user data (there is none yet). If the Cloudflare account was created with an email you may lose access to (university mail), fix it **now** — account ownership is the one thing later phases cannot easily migrate.

**Changelog:** _(record actuals: hours spent, cuts made, spec deviations — append entries here as the phase progresses)_

---

_Next phase: [`03-phase-1-design-system.md`](03-phase-1-design-system.md)_
