# 01 — Execution Plan: Phases, Gates & Delivery Model

> **Portfolio Production Handbook v2.0 (Engineering Edition) — October 2026**
> This plan **supersedes Blueprint v4 Part 6** (the original SDLC), which still described a FastAPI-backend architecture that was rejected in the v2 fact-check in favor of the $0 static-first stack. It also supersedes the single-file `AI-Portfolio-Production-Handbook.md` (v1.0), which was an operations manual without a delivery plan.
>
> **Design rationale lives in the blueprint. Execution truth lives here.** When these documents disagree, this handbook wins for _how_ and _when_; the blueprint wins for _why_.

---

## 1.1 What This Plan Is

This document fragments the entire portfolio project — public site, content engine, admin panel, resume builder, AI/automation, hardening, and launch — into **9 sequential phases (Phase 0–8)**, each with:
- A **bounded scope** (explicit in/out lists, so scope creep has nowhere to hide)
- **Ticket-ready task breakdowns** (`Pn-nn` IDs, estimates, dependencies — each row can be pasted into a GitHub issue as-is)
- **Measurable acceptance criteria** (every criterion is objectively checkable, no "looks good")
- A **Definition of Done** and an **exit gate (G0–G8)** that blocks the next phase until passed
- **Rollback and risk notes** specific to that phase's blast radius

The phasing follows one engineering rule learned from the blueprint's own research (Part 15.3): **completeness beats ambition — ship a small phase fully green rather than a large phase mostly done.** Every phase ends with something deployed, observable, and reversible.

## 1.2 Phase Overview

| Phase  | Name                      | Goal (one line)                                                   | Effort¹            | Exit gate             |
| ------ | ------------------------- | ----------------------------------------------------------------- | ------------------ | --------------------- |
| **P0** | Foundation & Environments | Repo, tooling, CI skeleton, first deploy to `*.pages.dev`         | 6–8 h (1 wk)       | G0 — Skeleton live    |
| **P1** | Design System & App Shell | Tokens, fluid typography, layout shell, home page, dark mode      | 14–18 h (2 wk)     | G1 — Shell rendered   |
| **P2** | Content Engine            | All collections + schemas + routes + images + seed content        | 24–30 h (3 wk)     | G2 — Content complete |
| **P3** | Discovery & Engagement    | Search, RSS, SEO, OG cards, comments, /now, contact form          | 16–20 h (2 wk)     | G3 — Discoverable     |
| **P4** | Admin Panel (CMS)         | Sveltia CMS, OAuth, R2 media, editorial workflow, all collections | 12–16 h (1.5–2 wk) | G4 — Owner operable   |
| **P5** | Resume Builder            | One `resume.json` → Standard + Europass templates + PDFs          | 14–18 h (2 wk)     | G5 — Resume shipped   |
| **P6** | AI & Automation           | Chatbot Worker, AI Lab demos, GitHub sync, draft-PR automation    | 18–24 h (2–2.5 wk) | G6 — AI live          |
| **P7** | Hardening & Pre-Launch    | Security headers, a11y/perf gates, tests, legal, monitoring       | 14–18 h (2 wk)     | G7 — Production-ready |
| **P8** | Launch & Operations       | Domain decision, go-live, 7-day watch, ops handover               | 4–6 h (0.5–1 wk)   | G8 — Launched         |

¹ **Effort model:** one developer, intermediate skill, 8–10 focused hours/week. Total: **122–158 h ≈ 14–18 weeks part-time**, or **5–6 weeks full-time** (see 1.5).

### Phase detail files

| Phase | Spec file                                                                  | Phase         | Spec file                                                                                                                                      |
| ----- | -------------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| P0    | [`02-phase-0-foundation.md`](02-phase-0-foundation.md)                     | P5            | [`07-phase-5-resume-builder.md`](07-phase-5-resume-builder.md)                                                                                 |
| P1    | [`03-phase-1-design-system.md`](03-phase-1-design-system.md)               | P6            | [`08-phase-6-ai-automation.md`](08-phase-6-ai-automation.md)                                                                                   |
| P2    | [`04-phase-2-content-engine.md`](04-phase-2-content-engine.md)             | P7            | [`09-phase-7-hardening.md`](09-phase-7-hardening.md)                                                                                           |
| P3    | [`05-phase-3-discovery-engagement.md`](05-phase-3-discovery-engagement.md) | P8            | [`10-phase-8-launch.md`](10-phase-8-launch.md)                                                                                                 |
| P4    | [`06-phase-4-admin-cms.md`](06-phase-4-admin-cms.md)                       | Cross-cutting | [`11-tech-specs.md`](11-tech-specs.md) · [`12-quality-specs.md`](12-quality-specs.md) · [`13-operations-runbook.md`](13-operations-runbook.md) |

## 1.3 Dependency Graph & Critical Path

```text
P0 Foundation
 └─> P1 Design System
      └─> P2 Content Engine
           ├─> P3 Discovery & Engagement ────────┐
           ├─> P4 Admin Panel (CMS) ──────────────┤
           │    └─> P5 Resume Builder ────────────┼─> P7 Hardening ─> P8 Launch
           └─> P6 AI & Automation ────────────────┘

Legend:  ──>  hard dependency      ─────  order can be swapped
```

- **Hard dependencies are real, not bureaucratic:** P1 needs P0 (CI + deploy target); P2 needs P1 (layouts to render into); P4 needs P2 (the CMS edits schema-validated files, so schemas must exist first); P5's CMS form needs P4 (templates can start after P2); P7 needs everything feature-complete; P8 needs G7 green.
- **Interleaving is allowed and encouraged:** P3, P4, and P6 draw on P2 and are independent of each other. A part-time developer working "one phase at a time" should still start P4's OAuth app registration early (third-party account setup has unpredictable latency), and P6's Worker skeleton early (it's the largest novel component).
- **Critical path:** `P0 → P1 → P2 → P6 → P7 → P8` ≈ 80–104 h. If the schedule slips, cut from P3/P4/P5 scope (below), never from P6/P7 — the chatbot and the quality gates are the hiring signals.

### Scope-cut order (pre-agreed, so triage is calm)

When a phase overruns, cut in this order and record the cut in the phase file's changelog:
1. **P3 luxuries:** giscus comments (feature-flag off), per-page OG cards (fall back to one static card)
2. **P5:** Europass PDF automation (keep print-CSS path; Typst becomes fast-follow)
3. **P4:** Cloudflare Access second lock (OAuth + repo permissions already enforce the boundary)
4. **P6:** AI Lab Tier-2 Streamlit demos (Tier-1 edge demos + Tier-3 recorded GIFs remain)
5. **Never cut:** schema validation, CI gates, a11y checks, the draft-PR pattern, security headers

## 1.4 Milestones & Gates

Each gate is a go/no-go review with binary criteria. A gate not passed = the next phase does not start. The gate checklists live at the bottom of each phase file; this table is the program-level view.

| Milestone | Gate                    | Definition (summary)                                  | Observable proof                                                                      |
| --------- | ----------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------- |
| M0        | **G0** Skeleton live    | Repo + CI + first deploy working                      | `https://<name>.pages.dev` serves scaffold; CI green on a test PR                     |
| M1        | **G1** Shell rendered   | Design system + home page in production               | Home responsive 360/768/1280; Lighthouse a11y ≥ 95; dark mode persists                |
| M2        | **G2** Content complete | All 6 content collections + singletons render         | Every route renders seeded content; `astro check` clean; build < 3 min                |
| M3        | **G3** Discoverable     | Search/feed/SEO/comments/form work                    | Search finds seeded docs; RSS validates; Lighthouse SEO = 100                         |
| M4        | **G4** Owner operable   | Full CMS roundtrip without a terminal                 | Edit→draft PR→preview→merge→live from a phone, per collection                         |
| M5        | **G5** Resume shipped   | Both templates + PDFs from one source                 | `/resume` renders active template; PDFs text-selectable & ATS-parseable               |
| M6        | **G6** AI live          | Chatbot + automation pipelines guarded & knowledgable | Chatbot answers from KB; rate limits + injection tests pass; sync PR appears          |
| M7        | **G7** Production-ready | All quality gates green                               | securityheaders.com A+; LHCI budgets pass; Playwright/axe/lychee clean; monitors live |
| M8        | **G8** Launched         | Public go-live + stable watch                         | Domain decision executed; 7 consecutive green days; rollback drill done               |

## 1.5 Effort Model & Scheduling Scenarios

**Assumptions:** one developer, comfortable with TypeScript/CSS/git, new to Astro and Cloudflare Workers; estimates include testing and documentation of the work itself; third-party account setups (OAuth apps, R2 buckets) are counted at their realistic latency including one "wait for email / find the new dashboard location" cycle.

| Scenario                     | Cadence                        | Calendar        | Notes                                                |
| ---------------------------- | ------------------------------ | --------------- | ---------------------------------------------------- |
| **A. Part-time (baseline)**  | 8–10 h/wk, one phase at a time | **14–18 weeks** | The estimates in this handbook are calibrated here   |
| **B. Part-time interleaved** | 8–10 h/wk, P3/P4/P6 overlap    | 12–14 weeks     | Requires task-level discipline; use the graph in 1.3 |
| **C. Full-time sprint**      | 30 h/wk                        | 5–6 weeks       | Two-buffer-week rule: plan 7, expect 6               |

Estimates are **ranges, not promises**. The correct use of a range is: track your actual hours per phase in the phase file's status line; if the lower bound is exceeded with the gate still open, apply the scope-cut order (1.3) rather than silently extending.

## 1.6 Risk Register

| ID  | Risk                                                                            | P¹  | I¹  | Mitigation (owner + trigger)                                                                                                                                                         |
| --- | ------------------------------------------------------------------------------- | --- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R1  | OAuth/Worker setup stalls on Cloudflare dashboard churn (documented pain point) | M   | M   | Start P4 account setup during P2; use `wrangler deploy` CLI path, not the dashboard button; community workaround notes in `06-phase-4-admin-cms.md`                                  |
| R2  | R2 CORS / credential misconfig blocks CMS uploads                               | M   | M   | Exact CORS JSON is specced in `11-tech-specs.md` §5; secret key never in config.yml — enter once in CMS UI                                                                           |
| R3  | Sveltia CMS breaking change (pre-1.0 software)                                  | L   | M   | Pin exact version in `package.json`; config is Decap-compatible → drop-in replacements exist (Pages CMS, Keystatic); content files are the real source of truth, so CMS is swappable |
| R4  | CSP breaks a feature at the worst time                                          | M   | M   | Two-step rollout in P7: `Content-Security-Policy-Report-Only` for 1 week, then enforce; scoped permissive block for `/admin`                                                         |
| R5  | Build time creeps past 5 min as content grows                                   | M   | L   | Pagination + `astro check` in CI stays cached; alert at 4 min; Pagefind index is incremental to build output                                                                         |
| R6  | GitHub Actions cron drift / 60-day auto-disable                                 | M   | L   | Heartbeat commit job (P6) both powers `/now` stamp and counts as repo activity; Cloudflare Cron Triggers are the documented fallback scheduler                                       |
| R7  | Groq free-tier limits change (they did before)                                  | M   | M   | Provider-agnostic Worker (OpenAI-compatible base URL swap); Workers AI as fallback provider; kill-switch env var                                                                     |
| R8  | Solo-dev momentum loss / scope creep                                            | H   | M   | Phases with binary gates; scope-cut order (1.3); every phase ships something visible; weekly 30-min review ritual (`13-operations-runbook.md`)                                       |
| R9  | Free-tier terms drift (UptimeRobot personal-use, etc.)                          | L   | L   | Quarterly free-tier drift review (runbook); BetterStack/commercial-safe alternatives pre-listed in `12-quality-specs.md`                                                             |
| R10 | INP/JS regressions from new islands                                             | M   | M   | ≤ 60 KB gzip first-party JS budget CI-enforced (LHCI assertion); `client:visible` default; island budget table in `12-quality-specs.md`                                              |

¹ P = probability, I = impact (L/M/H). Register is reviewed at every gate review; new risks get IDs R11+.

## 1.7 Working Agreements (How the Code Gets Written)

These are the team conventions for a team of one — they exist because they make the solo engineer fast, not because process is fun.

**Branching — trunk-based.** `main` is always deployable (Cloudflare Pages deploys every push to `main`). Work happens on short-lived branches (`feat/p2-blog-routes`, `content/p4-fix-book-rating`), merged via PR after CI passes. Content edits made through the CMS follow the same law automatically: the editorial workflow _is_ a draft PR (Blueprint Part 10.8). `main` is protected: require the `ci` workflow, no direct pushes, `CODEOWNERS` = owner.

**Commits — Conventional Commits.** `feat:`, `fix:`, `content:`, `chore:`, `docs:` — enforced by a commitlint hook. Reason: the git history doubles as the portfolio's "real iteration" evidence that 2026 reviewers read (Blueprint Part 15.3).

**Tasks — issues, one per row of the phase tables.** Each `Pn-nn` task becomes a GitHub issue with that ID in the title (`P2-04 Build blog routes`), labeled by phase, attached to the phase's GitHub **Milestone**. Status columns in the phase files mirror issue state. Definition of Ready: the task's spec reference is readable and acceptance criteria exist. Definition of Done: code merged, CI green, acceptance boxes ticked, docs updated.

**Pull requests.** Template (`.github/PULL_REQUEST_TEMPLATE.md`) includes: what/why (1–3 sentences), screenshots for UI, **a11y checklist** (keyboard pass, contrast, reduced-motion), **perf checklist** (JS added? island directive justified? budget impact), and links to the task ID. PRs under ~400 lines of diff are the norm; if bigger, split.

**Reviews.** Solo, so "review" = the PR checklist + the deploy preview URL. Every PR gets a Cloudflare Pages preview automatically; UI changes are reviewed _on the preview at 360px width_, not in the diff.

**Definition of Done (global, applies to every task).** Merged to `main` via green-CI PR · renders/works on the production deploy · acceptance criteria in the phase file ticked · no new a11y or perf-budget violations · relevant handbook section updated if behavior changed.

## 1.8 Change Control

- **Scope:** new ideas do not enter the current phase. They go to `backlog.md` (created in P0) and are triaged at gate reviews. This rule is what keeps the 14–18-week estimate honest.
- **Specs:** this handbook is docs-as-code — edit it via PR like code, and note _why_ in the commit body. When reality contradicts the spec during implementation, the spec loses; update the spec in the same PR that proved it wrong.
- **Vendor changes:** free tiers and APIs are re-verified quarterly (runbook §13.6); a tier change is a normal PR against `11-tech-specs.md`, never a surprise rewrite.
- **Gate failures:** a failed gate is not a failure — it is the system working. Apply scope-cut order (1.3), record what was cut and why in the phase file, and re-run the gate.

## 1.9 Traceability — Blueprint → Phases

| Blueprint v4 part                                                | Executed in                                                                       |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Part 3 (menu structure)                                          | P1 (nav), P2 (routes)                                                             |
| Part 4 & 15.5 (design system, fluid type)                        | P1                                                                                |
| Part 5 (layouts)                                                 | P1–P2                                                                             |
| Part 7 (page content)                                            | P2                                                                                |
| Part 9.4–9.5 (git-as-database, rate-limit awareness)             | P2, P6                                                                            |
| Part 10 (production layers)                                      | spread: headers P7, tests P2+P7, monitoring P7, legal P7, draft-PR P4/P6          |
| Part 11 ($0 stack)                                               | P0 (accounts), throughout                                                         |
| Part 11.3–11.5 (chatbot, AI Lab, automation)                     | P6                                                                                |
| Part 12 (admin panel)                                            | P4                                                                                |
| Part 13 (resume builder)                                         | P5                                                                                |
| Part 14 (full-site admin, singletons)                            | singletons authored in P1–P2 ("nothing hard-coded" from the start), exposed in P4 |
| Part 15.6–15.9 (state matrix, features, budgets, analytics loop) | P3, P7, runbook                                                                   |

**Key engineering deviation from the blueprint:** Part 14 planned a retroactive "nothing hard-coded" refactor (~2–3 days) because v3 had hard-coded first. This plan avoids the debt: singletons (`pages/*.yaml`, `theme.yaml`, `navigation.yaml`, …) are authored **when each page is built** (P1–P2), so P4 only wires the CMS onto files that already exist. The retrofit cost is paid once, in the phase where it is cheap.

---

_Next: [`02-phase-0-foundation.md`](02-phase-0-foundation.md) — or, for the underlying specs referenced by every phase, jump to [`11-tech-specs.md`](11-tech-specs.md)._
