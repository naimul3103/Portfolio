# Phase 7 — Hardening & Pre-Launch

> **Status:** NOT STARTED · **Depends on:** G3, G4, G5, G6 (feature-complete) · **Effort:** 14–18 h (2 weeks) · **Exit gate:** G7
> **Spec references:** [`12-quality-specs.md`](12-quality-specs.md) (all sections — this phase _executes_ that spec) · Blueprint v4 Parts 10.1–10.7, 15.8

---

## 7.1 Objectives

Convert "works" into "production-grade": final security headers with a disciplined CSP rollout, full accessibility pass, CI-enforced performance budgets, the complete test suite (unit + E2E + axe + links), legal/privacy/AI-disclosure pages, monitoring, and a rehearsed disaster-recovery drill. This is where the blueprint's claim that "junior engineers who ship CSP headers and CI accessibility gates are rare" (Part 10) gets converted into evidence in the repo. No new features enter this phase — hardening is a feature freeze with teeth.

## 7.2 Scope

| In scope                                                                                                                       | out of scope (goes to)                                        |
| ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| `public/_headers`: HSTS, nosniff, Referrer-Policy, X-Frame-Options, Permissions-Policy, **CSP** (report-only 1 week → enforce) | Custom domain / DNS (P8)                                      |
| CSP entries finalized for: giscus, Turnstile, CWA, R2 media, auth worker                                                       | WAF rules (Cloudflare free tier covers the essentials)        |
| Full keyboard + screen-reader + reduced-motion audit; 44px target check                                                        | New component work (frozen)                                   |
| Lighthouse CI with budget assertions wired to PRs                                                                              | Real-user monitoring (CWA covers trends)                      |
| Playwright suite finalized (nav, search, chat mocked, gallery, resume)                                                         | Load testing (static CDN; pointless here)                     |
| Legal: privacy policy, AI disclosure page, photo consent check, GDPR basics                                                    | Cookie banner (none needed — cookieless analytics, Part 10.7) |
| Monitoring: UptimeRobot (or BetterStack) + Sentry alerts wired                                                                 | On-call rotation (solo owner — runbook instead)               |
| Backup/DR drill (restore from git + R2) + content proofread                                                                    | Launch announcement (P8)                                      |

## 7.3 Prerequisites (Entry Criteria)

All feature gates green (G3–G6). No open `feat/` branches — freeze is real: UI-affecting merges during P7 restart the audit tasks.

## 7.4 Task Breakdown

| ID    | Task                                         | Details / spec ref                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Est               | Depends |
| ----- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ------- |
| P7-01 | Author `public/_headers` (report-only first) | Exact header block in quality-specs §2.1: HSTS (max-age 1y, includeSubDomains), X-Content-Type-Options, Referrer-Policy `strict-origin-when-cross-origin`, X-Frame-Options DENY, Permissions-Policy (camera/mic/geo off), CSP with the full origin list (self, challenges.cloudflare.com, giscus.app + its assets, static.cloudflareinsights.com, R2 public URL, auth worker) + scoped permissive block for `/admin/*`. **Ship as `Content-Security-Policy-Report-Only`** | 2 h               | —       |
| P7-02 | CSP violation triage week                    | Watch console + report endpoint (Cloudflare logs or a tiny Worker collector); every violation is either a header fix or a code fix; log decisions in `docs/csp-log.md`. **After 7 clean days: enforce** (remove `-Report-Only`)                                                                                                                                                                                                                                           | 1 h (+1 wk watch) | P7-01   |
| P7-03 | Accessibility deep pass                      | Keyboard: full nav/ tab order, focus visible, skip link works, lightbox + chatbot + filters operable. Screen reader (NVDA or VoiceOver): headings/landmarks/alt/aria-live sane. `prefers-reduced-motion: reduce` freezes every animation (P1-04 proof). Touch targets ≥ 44px. axe-core scan clean on all routes                                                                                                                                                           | 3 h               | —       |
| P7-04 | Lighthouse CI budget enforcement             | `lhci autorun` in CI (PR-gated): budgets per quality-specs §3 — LCP ≤ 2.5 s, CLS ≤ 0.1, INP ≤ 200 ms, **first-party JS ≤ 60 KB gz on worst page**, total transfer ≤ 500 KB on home. Failing budget = red PR (risk R10 enforcement)                                                                                                                                                                                                                                        | 2 h               | —       |
| P7-05 | Playwright suite finalization                | Consolidate P6's chatbot tests + add: nav smoke (all routes), search queries, gallery lightbox, resume both-templates, contact form happy path (mock Resend), 404. axe assertions run on the same pass (axe-playwright per Part 10.5)                                                                                                                                                                                                                                     | 2.5 h             | —       |
| P7-06 | Link + HTML validation                       | lychee over built HTML (internal + external), html-validate for structure; allowlist for flaky externals documented                                                                                                                                                                                                                                                                                                                                                       | 1 h               | —       |
| P7-07 | Legal & disclosure pages                     | `/privacy` (controller, data collected: chatbot query-length + hashed IP + timestamps for abuse prevention, retention N days, deletion contact; contact-form usage; cookieless analytics), `/ai-disclosure` (plain-language "How this AI works": model, data sources, human-review process — Part 10.7), photo-consent audit (identifiable people in gallery → consent or blur), GDPR/CCPA one-pager folded into privacy                                                  | 2.5 h             | —       |
| P7-08 | Monitoring wiring                            | UptimeRobot free (50 monitors — use 2: `/` and `/api/chat` health) or BetterStack free (commercial-safe — quality-specs §6 note); Sentry free tier alerts → email; weekly digest. Verify alert fires on a deliberately broken preview deploy (test in preview, not prod)                                                                                                                                                                                                  | 1.5 h             | —       |
| P7-09 | Backup & DR drill                            | **Execute, don't write down:** fresh `git clone` on a spare machine → `pnpm install && pnpm build` → `npx wrangler pages deploy dist` (or second Pages project) → verify site renders; R2 media restore path verified (bucket objects immutable in git history via manifest; sync script can re-upload). Record actual minutes-to-restore in runbook §13.5                                                                                                                | 1.5 h             | —       |
| P7-10 | Content proofread + SEO verify               | Full copy proofread (resume-adjacent claims — Part 10.8 standard); Search Console + Bing Webmaster verified (properties claimed in P3, now data flowing); Rich Results: Person + BlogPosting pass; OG previews spot-checked on LinkedIn/Slack/Discord                                                                                                                                                                                                                     | 1.5 h             | P7-05   |
| P7-11 | Launch-readiness review                      | Walk the G7 gate checklist below with the runbook open; fix or explicitly defer (with backlog entry) every red item; freeze `main` for 48 h before P8                                                                                                                                                                                                                                                                                                                     | 1 h               | all     |

## 7.5 Implementation Notes

**CSP rollout is a two-step because enforcement day-one breaks something.** The report-only week converts "probably fine" into a zero-violation log. The known tricky entries are already enumerated in quality-specs §2.2 (Astro's inline island scripts → the ≤ 1 KB theme script from P1-08 needs a `'sha256-…'` hash in `script-src`, computed at build and injected into `_headers` by a small build step — this is the only dynamic header, keep it mechanical).

**Budgets are enforced at PR time, not discovered at launch.** LHCI runs against the PR preview (Cloudflare Pages preview URL) — a regressing change is red before merge, which is the entire point of having gates. If preview-URL flakiness makes LHCI noisy, run against a locally built and served `dist` in the same CI job (deterministic; slightly less "real", much less flaky).

**The DR drill is the phase's real deliverable.** A backup strategy that has never been restored is a superstition. The drill proves the blueprint's structural claim (Part 10.6): static files in git + `wrangler` = the site is portable in minutes, host-agnostic, and no single vendor failure can take the portfolio down. Write the measured restore time into the runbook — future-you will not believe past-you's estimates otherwise.

**Feature freeze includes "small" copy changes.** Every string is content (P1/P2 rule), so copy edits re-render pages — during P7's audit window, copy edits wait in a branch and merge after G7. One week of editorial patience buys an audit that stays true through launch.

## 7.6 Acceptance Criteria

- [ ] **securityheaders.com grade A+** on production; CSP enforced (no `-Report-Only`) with 7 clean days logged in `docs/csp-log.md`
- [ ] axe-core: zero critical/serious violations on all routes; keyboard-only user can reach every function incl. chat + lightbox; reduced-motion verified; manual SR pass notes in `docs/a11y-notes.md`
- [ ] LHCI budgets green on 3 consecutive PRs; worst-page JS (home with chat trigger) **≤ 60 KB gz** measured and recorded
- [ ] Playwright suite green in CI in < 5 min (including mocked chatbot + axe pass); lychee zero broken links (allowlist documented)
- [ ] `/privacy` + `/ai-disclosure` live, linked in footer; photo consent resolved (list of consents/blurs in `docs/`)
- [ ] Monitors live and **an alert was observed end-to-end** (test outage in preview); Sentry receives a test event
- [ ] DR drill executed: restore measured in minutes, recorded in runbook; R2 media path verified
- [ ] Search Console + Bing show verified properties; Rich Results pass for Person + BlogPosting
- [ ] `main` frozen 48 h with zero hotfixes — stability is itself an acceptance criterion

## 7.7 Definition of Done (Phase)

All acceptance boxes ticked · quality-specs updated where reality differed (it will — that file is alive) · every deferred item has a backlog entry with a reason · runbook v1 complete and tested (it becomes the P8 handoff document).

## 7.8 Exit Gate G7 — Production-Ready

| #   | Check                                          | Verified by              |
| --- | ---------------------------------------------- | ------------------------ |
| 1   | Security headers A+, CSP enforced              | securityheaders.com scan |
| 2   | A11y: automated clean + manual pass documented | axe report + notes       |
| 3   | Perf: budgets green, JS ≤ 60 KB                | LHCI runs                |
| 4   | Tests: unit + E2E + links green in CI          | workflow logs            |
| 5   | Legal/disclosure pages live                    | URL check                |
| 6   | Monitoring + alerting proven end-to-end        | test alert               |
| 7   | DR drill done, restore time recorded           | runbook entry            |

## 7.9 Risks & Rollback

**Risk R4 (CSP breakage)** is the phase's resident hazard; the report-only week + scoped `/admin` block + the dynamic hash injection are the whole mitigation — and worst case, reverting to report-only is a one-line `_headers` change that deploys in seconds. **Rollback:** hardening is additive; any individual gate can be relaxed (documented in the backlog) without touching site functionality. The one-way door is CSP enforcement, and it has its own emergency exit.

**Changelog:** _(record actuals: hours, CSP violations found during report-only week, restore minutes, LHCI scores)_

---

_Next phase: [`10-phase-8-launch.md`](10-phase-8-launch.md)_
