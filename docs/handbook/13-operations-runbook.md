# 13 — Operations Runbook

> **Portfolio Production Handbook v2.0 — steady-state operating manual.** Handed over at P8 (G8). Written for the owner at 11pm with a problem: every procedure starts from a symptom, ends in ≤ 15 minutes, and names the exact lever. Companion: `docs/owner-guide.md` (CMS how-to, non-technical).

---

## §13.1 Operating Calendar

| Cadence                | Task                                                                                                  | Time            | What good looks like                              |
| ---------------------- | ----------------------------------------------------------------------------------------------------- | --------------- | ------------------------------------------------- |
| Continuous             | Monitors watch `/` + `/api/chat`; Sentry watches Workers                                              | 0               | alert → §13.3 playbook                            |
| **Weekly** (5 min)     | Review draft PRs (sync + own edits) on phone; merge/reject                                            | Mon             | inbox zero on `main`; `content/data` fresh        |
| **Monthly** (30 min)   | Analytics → action ritual (quality-specs §8); quota dashboards (Groq, Workers AI neurons, Resend, R2) | 1st             | one content PR shipped; quotas < 50%              |
| **Quarterly** (60 min) | Free-tier drift review (Blueprint 17 ritual); secret rotation (tech-specs §10); DR drill (§13.5)      | Jan/Apr/Jul/Oct | tiers re-verified; keys rotated; restore measured |
| Yearly                 | Domain renewal (if bought); OAuth client secret rotate; handbook accuracy pass vs. reality            | Oct             | no auto-lapse emails                              |

## §13.2 Deploy Procedures

**Content deploy (the normal case):** edit via CMS → save → draft PR → CI runs → Pages builds the PR branch → owner opens preview URL on phone → merge → Pages rebuilds `main` → live. _There is no manual deploy step in the normal flow by design — the pipeline is the deploy._

**Worker deploy (`worker/site-api`):** push to `worker/site-api/**` → `deploy-worker.yml` runs `wrangler deploy` (tech-specs §9.2). Verify: `curl https://<site>/api/chat -X POST` returns a guarded response (not 522). Manual: `cd worker/site-api && wrangler deploy`.

**Emergency deploy (rare):** `git clone` → `pnpm build` → `npx wrangler pages deploy dist --project-name=<name>` — bypasses CI **and must be paired with a follow-up PR restoring `main` to the deployed state** (runbook law: production and `main` never diverge overnight).

**Verification law:** every deploy ends with one check — `curl -sI https://<site>/` = `200` + correct `_headers` present; Worker deploys end with one guarded call. No exceptions, no "it looked fine yesterday".

## §13.3 Incident Playbooks (symptom → action, ≤ 15 min each)

**P1 — Site down / 522-526 (rare: host-level).** 1. Check Pages dashboard → last `main` build status. 2. Build red → runbook §13.4 rollback (previous deploy, one click: Pages → Deployments → instant rollback). 3. Pages green but 5xx → Cloudflare status page; if degraded, wait — static files are multi-region, genuine outage ≈ never. 4. Still down → §13.5 DR drill for real (measured: minutes). _The site cannot go down because a data source did (Part 10.6's structural guarantee)._

**P2 — Chatbot broken (500s / always-fallback card).** 1. Sentry issue link → read the error. 2. `LLM_BASE_URL`/Groq quota? → check Groq dashboard; if quota exhausted → wait (daily reset) or flip `LLM_BASE_URL` to Workers AI (env var, `wrangler deploy`, risk R7 seam). 3. Turnstile outage (rare) → temporarily disable the turnstile check via Worker env flag, re-enable after. 4. Anything else → `wrangler rollback` (previous worker deploy) — chatbot degrades gracefully by design; the site never depends on it.

**P3 — Admin login fails.** 1. New domain and just changed config? → `ALLOWED_DOMAINS` env on auth worker missing the new host (P8 checklist item — fix is one var). 2. GitHub OAuth app deleted/rotated? → re-register; callback must be `https://<auth>.workers.dev/callback` (tech-specs §5.1). 3. Repo permission changed? → whoever lost write access cannot log in — that is the security model working, not a bug. 4. Still failing → bypass CMS: everything is files in git; edit + PR via github.com.

**P4 — CMS uploads fail (R2).** 1. `git diff` recent `admin/config.yml` → `public_url`/`prefix`/CORS drift. 2. Bucket CORS policy matches tech-specs §5.4 exactly (origin list includes current domain)? 3. Secret key entered on _this_ browser? (localStorage per-browser — new device = re-enter once). 4. r2.dev rate-limited (heavy-traffic day)? → upgrade to `media.<domain>` (P8 ladder). 5. Never debug CORS in prod: reproduce with the browser console's preflight error, which names the disallowed origin/method.

**P5 — Content stale (sync PRs stopped).** 1. Actions tab → workflow disabled banner? → 60-day inactivity rule fired → heartbeat stopped → re-enable + investigate why heartbeat failed (it is the canary). 2. Cron drift (known, harmless — Part 11.5) → run workflow manually once. 3. GraphQL failures → job skipped by design (stale > broken); if persistent > 24 h, check GitHub API status + token expiry (quarterly rotation slipped?). 4. Nothing ever lost: last good `content/data/*.json` still renders with its "last synced" badge.

**P6 — Form not delivering email.** 1. Resend dashboard → deliveries log (the source of truth). 2. Quota (100/day)? → bot volume through the honeypot? → tighten KV cap. 3. Suppression bounce (your own test address)? → remove from suppression list. 4. Turnstile misconfigured → server verify failing silently → Worker logs show 403s.

## §13.4 Rollback Levers (the four-minute undo table)

| What broke                      | Lever                                                                                   | Time    |
| ------------------------------- | --------------------------------------------------------------------------------------- | ------- |
| Bad content/config merge        | `git revert <merge-sha>` → push → rebuild                                               | ~3 min  |
| Bad deploy on Pages             | Pages → Deployments → **instant rollback** to any prior build                           | ~1 min  |
| Bad Worker deploy               | `wrangler rollback` (or rollback in dashboard)                                          | ~1 min  |
| Chatbot misbehaving             | kill-switch: `CHAT_ENABLED=false` + worker deploy                                       | < 1 min |
| R2 media issue                  | `public_url` env/config edit + rebuild (media URLs are content — don't mass-edit files) | ~5 min  |
| A theme I merged is ugly/broken | `git revert` the theme.yaml PR                                                          | ~3 min  |

**Universal undo = git.** Every artifact — content, config, tokens, even resume PDFs — is a committed file with history (Part 10.8). The audit trail is the PR list; the rollback story is `git log`. This table exists because "rollback is easy" is a claim until it's a rehearsed step.

## §13.5 Backup & Disaster Recovery

**What exists where:** code + content + config → GitHub (every state, forever, free). Media originals → R2 (`cms-uploads/` prefix) — R2 is _not_ git-versioned; its manifest (photo frontmatter references) is. Secrets → Cloudflare (Worker env) + `docs/secrets.md` registry (locations + rotation, never values). PDF artifacts → committed (`public/resume/`).

**Quarterly drill (measured, P7-09 sets the baseline):** 1. Fresh clone on spare machine. 2. `pnpm install && pnpm build` → verify `dist/` renders. 3. `npx wrangler pages deploy dist --project-name=<name>-drill` → click through home + one post + resume. 4. Media: restore path = photos' public URLs are in content; if R2 bucket lost, re-upload from local originals via CMS or `wrangler r2 object put` batch, then rebuild. 5. Record minutes-to-restore here: **baseline: ____ min (set at P7-09).**

**The structural guarantee (why this section is short):** there is no database to back up, no server to snapshot, no state that is not a commit or an R2 object. The DR plan for the whole system is: clone, build, deploy. (Part 10.6.)

## §13.6 Quarterly Review Checklist (free-tier drift — Blueprint Part 17 ritual)

- [ ] Re-verify every tier in tech-specs §1 against its pricing/limits page (Groq RPM/RPD, Workers 100k/day, R2 10 GB, Resend 100/day, UptimeRobot ToS, Sentry 5k, Sveltia + auth worker releases)
- [ ] Rotate quarterly secrets (Groq, R2 token, Turnstile, Resend, GitHub PAT) — rotate one at a time, verify each with a live call
- [ ] Run the DR drill (§13.5); update restore minutes
- [ ] Check Actions usage/minutes, Pages build count (500/mo free — a runaway loop would show here)
- [ ] Update tech-specs §1 with any tier change via PR; note in changelog
- [ ] Security headers re-scan (securityheaders.com A+ expected)

## §13.7 Launch Checklist (P8-02 executes this)

- [ ] Production URL: full route walk (every Part 3 menu item 200s; lightbox, search, chatbot, resume tabs, form all used once)
- [ ] `_headers` live + securityheaders.com A+ (enforced CSP, no Report-Only)
- [ ] Lighthouse quartet recorded: perf ≥ 90 · a11y ≥ 95 · BP ≥ 95 · SEO 100 (mobile, production)
- [ ] Both resume PDFs download from production and open with selectable text
- [ ] OG previews checked on LinkedIn + Slack + Discord (real link shares)
- [ ] Monitors green + one test alert observed end-to-end (P7-08)
- [ ] Search Console + Bing: sitemap submitted; coverage rising
- [ ] Admin: login + full edit roundtrip on production (mobile)
- [ ] Domain (if P8-B): SSL valid, apex↔www redirects, `site_url` + JSON-LD + `ALLOWED_DOMAINS` + `public_url` all on new domain, redirects from old
- [ ] Kill-switch drill done within the last 30 days
- [ ] `docs/launch.md` filled (URLs, scores, checklist state)

## §13.8 Troubleshooting FAQ (top 10, symptom-first)

| #   | Symptom                                                | Cause → Fix                                                                                                                                                  |
| --- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Build fails: zod error in a content file               | Schema violation (maybe a CMS edit used a bad value) → the error names file + field; fix via CMS or revert the PR                                            |
| 2   | Build fails: nav entry points nowhere                  | `navigation.yaml` has a route not in the registry → typo in `url` (§4 validation)                                                                            |
| 3   | CI green but page unchanged in prod                    | Edited a **draft**/unpublished PR; or CDN cache → hard-refresh; or you're looking at a preview URL                                                           |
| 4   | Search can't find a new post                           | Pagefind ran before OG step mis-ordered? Check build log order (P3-01); drafts are excluded **by design**                                                    |
| 5   | Chatbot answers something not on the site              | KB rebuilt at deploy; check the merged PR actually deployed; if draft content leaked → **that's a P1 bug**, kill-switch + investigate `/kb.json` immediately |
| 6   | OG card wrong after retheme                            | OG cards read `theme.yaml` — did `scripts/og.mjs` run? It's in CI between build and pagefind (§9.1 order)                                                    |
| 7   | Fonts look different on one machine                    | Variable font subset range: check unicode-range subsets (§3 quality) — extended glyphs may need a range update                                               |
| 8   | LHCI fails on preview but not locally                  | Preview cold-start latency skews LCP → run LHCI on locally built `dist` in CI (quality-specs §3 note) or re-run once                                         |
| 9   | "Last updated" on /now is old                          | Heartbeat failed → Actions tab (P5 playbook) — the badge is _supposed_ to show you this                                                                      |
| 10  | Everything looks fine; monitors green; but I'm worried | Run the quarterly drill (§13.5) anyway — that's what it's for                                                                                                |

---

_Return to: [`00-README.md`](00-README.md) · Plans: [`01-execution-plan.md`](01-execution-plan.md) · Specs: [`11-tech-specs.md`](11-tech-specs.md) · Quality: [`12-quality-specs.md`](12-quality-specs.md)_
