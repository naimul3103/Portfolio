# Portfolio Production Handbook — v2.0 (Engineering Edition)

> **October 2026 · Supersedes:** `AI-Portfolio-Production-Handbook.md` v1.0 (the single-file ops manual — kept for reference) and Blueprint v4 **Part 6** (the FastAPI-era SDLC).
> **Relationship to the blueprint:** `AI-Portfolio-Website-Blueprint-v4-Research-Upgraded.md` holds the _design rationale and research_ ("why"). This handbook holds _engineering execution_ ("what, when, to what standard, with which exact config"). Blueprint wins on why; handbook wins on how/when.

---

## Why This Edition Exists

The v1 handbook was an operations manual: good reference material, but **no delivery plan, no phases, no spec-level content** — a handbook you could read after building, not one you could build from. This edition is rebuilt engineer-first:
- **9 phases (P0–P8) with binary exit gates (G0–G8)** — every phase bounded in scope, ticket-ready tasks with IDs (`Pn-nn`), estimates, measurable acceptance criteria, DoD, and rollback notes
- **Real tech specs**: pinned stack matrix, full repo layout as a contract, zod content schemas, CMS/auth/media config _of record_, Worker API contracts, CI/CD workflow files, secrets registry
- **Quality budgets that fail PRs** (not aspirations): perf/hydration budgets, a11y checklist, CSP rollout procedure, testing matrix
- **A runbook written symptom-first** with rehearsed rollback levers and a measured DR drill

## Document Map

| #     | File                                                                                                                                                                                                                                                                                                                                       | Read it for                                                                                              |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| 00    | `00-README.md`                                                                                                                                                                                                                                                                                                                             | this map + conventions                                                                                   |
| 01    | [`01-execution-plan.md`](01-execution-plan.md)                                                                                                                                                                                                                                                                                             | **start here** — phases, gates, effort model, risks, working agreements                                  |
| 02–10 | [`02`](02-phase-0-foundation.md) · [`03`](03-phase-1-design-system.md) · [`04`](04-phase-2-content-engine.md) · [`05`](05-phase-3-discovery-engagement.md) · [`06`](06-phase-4-admin-cms.md) · [`07`](07-phase-5-resume-builder.md) · [`08`](08-phase-6-ai-automation.md) · [`09`](09-phase-7-hardening.md) · [`10`](10-phase-8-launch.md) | the nine phase specs (P0–P8)                                                                             |
| 11    | [`11-tech-specs.md`](11-tech-specs.md)                                                                                                                                                                                                                                                                                                     | stack, repo contract, schemas, CMS/auth/R2 config **of record**, Worker APIs, automation, CI/CD, secrets |
| 12    | [`12-quality-specs.md`](12-quality-specs.md)                                                                                                                                                                                                                                                                                               | security/CSP, performance budgets, testing matrix, a11y, SEO, observability                              |
| 13    | [`13-operations-runbook.md`](13-operations-runbook.md)                                                                                                                                                                                                                                                                                     | steady-state ops: calendar, incident playbooks, rollback, DR drill, FAQ                                  |

## Reading Orders by Role

- **Engineer building it (you):** 01 → your current phase file → 11/12 sections it cites. Keep 01.7 (working agreements) open for week 1.
- **Owner using it:** 13.1 calendar + `docs/owner-guide.md` (written at P4-09) → 13.8 FAQ. Never needs to read 02–10.
- **Reviewer/recruiter evaluating the system:** 01 (phases) → 11 §5–§9 (auth, CI, guardrails) → 12 §3 (budgets) — this trio is the engineering story the blueprint says reviewers reward.

## Conventions

- **Task IDs** `Pn-nn` are globally unique, one GitHub issue each, labeled by phase, tracked under nine Milestones. Status fields in phase files mirror issue state.
- **Phase header block** carries: Status · Depends on · Effort · Exit gate. Update status first when a phase starts.
- **Every acceptance criterion is objectively checkable** — if it can't be verified by a command, a URL, or a recorded artifact, it's not an acceptance criterion.
- **Changelog per phase file** records actuals (hours, cuts, deviations). Estimates are ranges, not promises (01 §1.5's rule).
- **This handbook is docs-as-code:** edit via PR, note _why_ in the commit body, and when reality contradicts the spec, fix the spec in the same PR that proved it wrong (01 §1.8).

## Engineering Corrections vs. Earlier Documents

Verified against official docs, **October 2026** (each is applied in the phase files; sources: Sveltia CMS docs, `sveltia-cms-auth` README, Cloudflare R2 docs):
1. **OAuth callback** is `https://<auth-worker>.workers.dev/callback` (the auth Worker's endpoint), _not_ `https://<site>/admin` as Blueprint v4 §12.5 sketched. Auth flow re-specced in 11 §5.1.
2. **`media_libraries`** (plural key) replaces the legacy `media_library` in Sveltia config; modern form used in 11 §5.2.
3. **R2 Secret Access Key must never be in `config.yml`** (it's committed to the repo): official flow = enter once in CMS UI → browser localStorage; only the non-secret `access_key_id` lives in config. Secrets table in 11 §5.3.
4. **`publish_mode`** value in Sveltia for draft-PR-on-save is the editorial workflow (`editorial_workflow`), clarifying Blueprint's `preview` shorthand.
5. **Singletons are authored with the pages (P1–P2), not retrofitted** — Part 14's 2–3-day "nothing hard-coded" refactor is designed out of the schedule (01 §1.9).

## Quick Reference (the one-screen version)

```text
Build:  Astro 5 + Tailwind 4 + zod content collections      CMS: Sveltia (draft PRs)
Host:   Cloudflare Pages (Git integration, previews)         Media: R2 (CORS-specced)
Edge:   Workers (chat/contact/lab, secrets in env)           Auth: sveltia-cms-auth + GitHub OAuth
AI:     Groq free tier behind one Worker seam                PDFs: Typst in Actions
Gates:  G0 skeleton → G1 shell → G2 content → G3 discovery → G4 admin
        → G5 resume → G6 AI → G7 hardened → G8 launched
Budget: $0/month · JS ≤ 60 KB gz · LCP ≤ 2.5s · a11y ≥ 95 · SEO 100
Loop:   edit → draft PR → preview → merge → rebuild (content AND code AND AI KB)
```

---

_Handbook status: **v2.0, not yet executed** — phase files begin flipping to IN PROGRESS at P0. This README is the index; the execution plan is the contract._
