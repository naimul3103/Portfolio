# Phase 8 — Launch & Operations Handover

> **Status:** NOT STARTED · **Depends on:** G7 · **Effort:** 4–6 h (0.5–1 week, mostly watching) · **Exit gate:** G8
> **Spec references:** [`13-operations-runbook.md`](13-operations-runbook.md) (the handoff target) · Blueprint v4 Parts 11.7, 15.9

---

## 8.1 Objectives

Go public deliberately: make (and execute) the domain decision, run the launch checklist, announce where recruiters actually look, hold a seven-day stability watch, and hand the system over to its steady-state operating rhythm — the runbook's weekly/monthly rituals. The phase also closes the loop that makes this a portfolio _system_ rather than a project: a retrospective that converts build experience into the "what I'd do differently" evidence reviewers reward (Blueprint 15.3).

## 8.2 Scope

| In scope                                                                     | out of scope (goes to)                                                       |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Domain decision + execution (or documented `pages.dev` choice)               | Domain email (webmail/mail routing — backlog)                                |
| R2 media upgrade to custom domain **if** domain purchased (`media.<domain>`) | i18n, newsletter, PWA (rejected — Blueprint 15.10; revisit via backlog only) |
| Launch checklist execution                                                   | New features (feature freeze continues)                                      |
| Announcement: LinkedIn post, GitHub profile link, nownownow.com submission   | Press/release engineering (n/a)                                              |
| 7-day stability watch (uptime, Sentry, CWA, Search Console)                  | Real-user INP tuning (data first, quarterly review)                          |
| Retro + post-launch backlog triage                                           | —                                                                            |
| Operations handover: runbook walkthrough + calendar blocks for rituals       | —                                                                            |

## 8.3 Prerequisites (Entry Criteria)

G7 green and `main` stable through the 48 h freeze. **Domain decision made explicitly** — write it down before executing:
- **Option A — stay on `<name>.pages.dev` (default, $0):** honest verdict from Blueprint 11.7: recruiters do not judge `pages.dev`; the site's quality is the signal. Costs nothing, zero DNS risk.
- **Option B — custom domain (~$10–12/yr, at-cost at Cloudflare):** buy when the site is stable (now), because it also upgrades: R2 media to `media.<domain>` (production-grade public URL, P4's documented upgrade), email-sender reputation for Resend, and permalink permanence for Search Console.

The plan assumes **B if budget allows, A is a fully valid launch** — G8 does not require a domain; it requires the _decision_ to be executed and documented.

## 8.4 Task Breakdown

| ID    | Task                    | Details / spec ref                                                                                                                                                                                                                                                                                                                                        | Est         | Depends |
| ----- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------- |
| P8-01 | Execute domain decision | A: document choice + skip to P8-03. B: buy domain → Cloudflare Pages custom domain (auto-SSL, auto-redirect config: apex↔www, force HTTPS) → update `site_url` + Person JSON-LD + canonical + OAuth `ALLOWED_DOMAINS` + R2 `public_url` → redeploy + retest admin roundtrip once (config keys are content: each change is a PR with the checklist re-run) | 2 h         | —       |
| P8-02 | Launch checklist run    | Runbook §13.7: full route walk, search, chatbot, resume PDFs download, OG preview, 404, Lighthouse quartet recorded (perf ≥ 90, a11y ≥ 95, BP ≥ 95, SEO = 100) on production URL, monitors green, kill-switch drill re-verified                                                                                                                           | 1 h         | P8-01   |
| P8-03 | Announce                | LinkedIn post (link + one system-design sentence — "running on $0 infrastructure with a human-reviewed automation pipeline" is the story, Blueprint 11.3), GitHub profile → portfolio link, `/now` submitted to nownownow.com, giscus enabled on the announcement-worthy post                                                                             | 1 h         | P8-02   |
| P8-04 | 7-day stability watch   | Daily 5-min check (automated monitors + a human glance): uptime, Sentry, CWA top pages, Search Console coverage. Success = 7 consecutive green days; any incident → runbook playbook + day-counter resets honestly                                                                                                                                        | 1 h (daily) | P8-03   |
| P8-05 | Retro + backlog triage  | 60 min: what shipped vs plan (phase actuals from changelogs), the three biggest surprises, "what I'd do differently" written into the About/case-study content (Blueprint 15.3 field — _your own project now has it_), backlog triage (rejected-list items stay rejected unless evidence emerged)                                                         | 1 h         | P8-04   |
| P8-06 | Operations handover     | Calendar blocks created: weekly 5-min PR review, monthly 30-min analytics ritual (Blueprint 15.9), quarterly free-tier drift + secret rotation review. Runbook read once end-to-end; owner guide re-read                                                                                                                                                  | 0.5 h       | P8-05   |

## 8.5 Implementation Notes

**The domain change is a config-as-content change — treat it like one.** Every URL this system records lives in content/config files (`seo.yaml`, `site-config.yaml`, `chatbot-config.yaml`, CMS `ALLOWED_DOMAINS`, R2 `public_url`) — the launch task is a checklist of _those files_, not a code hunt. This is the P1/P2 "nothing hard-coded" discipline paying its dividend at the worst possible moment to discover an exception (launch day).

**Permalink discipline.** Whatever URL you launch with is what Search Console, the LinkedIn post, the resume PDF, and the nownownow.com directory will permanently record. Changing your mind later costs rankings + a redirect layer. Hence: decide in writing (8.3), execute once, never churn.

**The announcement is a system demo, not a "look at my site."** The portfolio's differentiators — chatbot that answers from your own content, automation that respects human review, $0 bill — are one sentence each in the post. The interview rehearsal the blueprint mentions (15.3: "walk me through how this portfolio was built") is now answerable from lived experience; the retro task is where you write that answer down while it's fresh.

**Stability watch is part of effort, not paranoia.** The 7-day counter has a real function: it forces _any_ lurking issue (cron drift, quota surprise, R2 rate-limit on a viral day) to surface while attention is high, instead of in month three when nobody is watching. If the counter resets twice, the runbook's incident playbooks get exercised — that's the system working, not failing.

## 8.6 Acceptance Criteria

- [ ] Domain decision **executed and documented** (A: `docs/launch.md` states choice; B: domain live, SSL valid, apex/www redirect, all config files updated in PRs with roundtrip re-tested)
- [ ] Launch checklist 100% green, Lighthouse quartet recorded on production
- [ ] Announcements posted (LinkedIn + GitHub profile + nownownow.com if A-or-B)
- [ ] 7 consecutive green days (uptime + zero Sentry criticals); counter result recorded
- [ ] Retro written: actual-vs-plan per phase, top-3 surprises, "what I'd do differently" content drafted
- [ ] Calendar rituals created (weekly/monthly/quarterly); runbook + owner guide re-verified readable
- [ ] Backlog triaged post-launch; every rejected feature stays rejected with its Blueprint 15.10 reason unless new evidence exists

## 8.7 Definition of Done (Phase) — and Program

All acceptance boxes ticked · `docs/launch.md` records the launch state (URLs, checklist output, Lighthouse scores) · **all 9 phase changelogs closed with actuals** — the deltas between estimate and actual are the retrospective's data · handbook marked **v2.0 — shipped** in README.

## 8.8 Exit Gate G8 — Launched

| #   | Check                                                  | Verified by          |
| --- | ------------------------------------------------------ | -------------------- |
| 1   | Public URL serves the complete site, stable for 7 days | monitors + logs      |
| 2   | All launch checklist items green, recorded             | `docs/launch.md`     |
| 3   | Owner rituals in calendar, runbook handed over         | calendar + owner ack |
| 4   | Retro + backlog complete                               | retro doc            |
| 5   | Every handbook changelog filled with actuals           | this directory       |

## 8.9 Risks & Rollback

**Launch-day regressions** are almost always one of: a config-file typo in the domain PR (caught by the re-test roundtrip), an OAuth `ALLOWED_DOMAINS` miss (admin login fails on the new domain — symptom obvious, fix one env var), or a DNS propagation wait (honest note: apex records can take minutes-to-hours; the runbook says wait before debugging). **Rollback:** `pages.dev` never goes away — a broken domain config is bypassed by the origin URL in one bookmark. That fallback is why the domain decision was safe to take _after_ everything else was already production-grade.

**Changelog:** _(record actuals: hours, launch date, 7-day outcome)_

---

_Program complete. Steady-state operations: [`13-operations-runbook.md`](13-operations-runbook.md)._

_Next up: cross-cutting specs — [`11-tech-specs.md`](11-tech-specs.md)_
