# Phase 4 — Admin Panel (CMS)

> **Status:** NOT STARTED · **Depends on:** G2 (schemas exist; can run parallel to P3) · **Effort:** 12–16 h (1.5–2 weeks) · **Exit gate:** G4
> **Spec references:** [`11-tech-specs.md`](11-tech-specs.md) §5 (CMS, auth, media — **includes three corrections verified against Sveltia's official docs, October 2026**), §7 (resume CMS wiring) · Blueprint v4 Parts 12, 14

---

## 4.1 Objectives

Give the owner full-site editing without a terminal: Sveltia CMS at `/admin`, authenticated by GitHub OAuth through the official `sveltia-cms-auth` Worker, media uploads to Cloudflare R2, with every collection and singleton from P1–P2 exposed as friendly forms — and automation-owned files marked read-only. Every save opens a draft PR (editorial workflow), so the Part 10.8 human-review guarantee covers owner edits too.

**Three spec corrections vs Blueprint v4** (verified against Sveltia's official documentation, October 2026 — the blueprint's Part 12 sketches predate these clarifications; this file is authoritative):
1. **OAuth callback URL** belongs to the **auth Worker** (`https://<auth>.workers.dev/callback`), _not_ `https://<site>/admin`. The flow is: CMS → Worker `/auth` → GitHub → Worker `/callback` → token back to CMS. Blueprint 12.5's callback example would silently fail.
2. **`media_libraries` (plural)** is the current config key; the legacy `media_library` single-provider key still works but is deprecated style. Use the modern key with the `cloudflare_r2` provider.
3. **R2 Secret Access Key never touches `config.yml`** (which is committed to the repo). Only the non-secret `access_key_id` is in config; the secret is entered once in the CMS UI and stored in **browser localStorage** per the official security note.

## 4.2 Scope

| In scope                                                            | out of scope (goes to)                                                      |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `/admin/index.html` + self-hosted Sveltia bundle (npm, pinned)      | CMS theming/custom previews (backlog)                                       |
| `admin/config.yml`: 6 collections + 13 singletons + read-only files | New content types (schema frozen at G2)                                     |
| GitHub OAuth app + `sveltia-cms-auth` Worker deploy (wrangler CLI)  | Cloudflare Access (optional second lock — P7 decision, cut per scope order) |
| R2: bucket, API token, CORS policy, public URL strategy             | Image processing pipeline (Sveltia does WebP at upload)                     |
| Editorial workflow end-to-end (save → draft PR → preview → merge)   | Multi-user roles (single owner by design)                                   |
| CMS-driven kill-switch + availability toggles verified              | Chatbot Worker itself (P6)                                                  |

## 4.3 Prerequisites (Entry Criteria)

G2 passed (schemas are the CMS form contract). Cloudflare account from P0 has Workers + R2 enabled. ~30 minutes of patience for one OAuth round-trip: this phase has the project's only third-party setup latency (risk R1) — start task P4-01 early, in parallel with P3, even if the rest waits.

## 4.4 Task Breakdown

| ID    | Task                                                | Details / spec ref                                                                                                                                                                                                                                                                                                                                                                                                                                         | Est   | Depends      |
| ----- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ------------ |
| P4-01 | Deploy `sveltia-cms-auth` Worker                    | Clone `github.com/sveltia/sveltia-cms-auth` → `wrangler deploy`. GitHub OAuth app: callback `https://<auth-worker>.workers.dev/callback`; set Worker env vars `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` (encrypted) + `ALLOWED_DOMAINS=<name>.pages.dev` (anti-abuse; official docs: stops other sites using the Worker _and_ stops token theft)                                                                                                         | 2 h   | —            |
| P4-02 | Add `/admin` static page + pinned Sveltia bundle    | `pnpm add -D sveltia-cms` (exact pin — pre-1.0, risk R3); `/admin/index.html` loads the bundled app from local assets — **no third-party CDN** (12.2 principle + keeps CSP tight)                                                                                                                                                                                                                                                                          | 1.5 h | P4-01        |
| P4-03 | Author `admin/config.yml` — full collection map     | Per tech-specs §5.2: backend (github + `base_url: <worker URL>`, `publish_mode: editorial_workflow`), modern `media_libraries.cloudflare_r2` block (access_key_id/bucket/account_id/public_url/prefix — **no secret**), then collections mirroring §3 schemas exactly (Books + Anime as `files`-type list widgets; Projects/Blog/Notes/Photos as `folder` collections; 13 singletons as `files` entries; `projects.json`/`activity.json` marked read-only) | 3 h   | P4-02        |
| P4-04 | Create R2 bucket + API token + CORS                 | Bucket `portfolio-media`; R2 API token scoped to that bucket only; CORS JSON exactly per tech-specs §5.4 (AllowedMethods GET/PUT/DELETE/HEAD, AllowedOrigins = `https://<name>.pages.dev`, ExposeHeaders ETag, MaxAge 3000 — official requirement: SigV4 preflight + delete/rename support); **public URL**: enable `r2.dev` now (dev-grade, rate-limited — honest note), custom `media.<domain>` documented as the P8 upgrade when a domain exists        | 2 h   | —            |
| P4-05 | Field types + editor UX pass                        | Widgets per §5.2 map: select for statuses/enums, number + min/max for ratings, image picker for covers (R2), list editor for books/anime rows, markdown editor for blog/notes with preview; hints on non-obvious fields (cover URL from Open Library — Blueprint 12.4)                                                                                                                                                                                     | 2 h   | P4-03        |
| P4-06 | Editorial workflow roundtrip test                   | For **each** collection: edit on phone → save → GitHub shows draft PR → Pages builds preview URL from the PR branch → open preview, verify change → merge → production updates. Fix whatever makes any step awkward — this loop IS the product of this phase                                                                                                                                                                                               | 2.5 h | P4-03, P4-04 |
| P4-07 | Media roundtrip test                                | Upload photo via CMS → appears in R2 bucket under `prefix` → renders on site after merge → rename + delete work in CMS (DELETE method in CORS proves itself) → auto-WebP conversion observed                                                                                                                                                                                                                                                               | 1 h   | P4-06        |
| P4-08 | Admin CSP scoping                                   | Scoped `_headers` block for `/admin/*`: allow `connect-src` to `api.github.com`, auth-worker origin, `<account>.r2.cloudflarestorage.com`, R2 public URL; everything else inherits the strict site policy (quality-specs §2 has the exact header block)                                                                                                                                                                                                    | 1.5 h | P4-03        |
| P4-09 | Owner runbook page                                  | Write `docs/owner-guide.md` (source for handbook §13.9): login, edit each collection, upload photos, review PR, merge, kill-switch, "what happens if I make a mistake" (revert) — written for the owner persona, no engineering jargon                                                                                                                                                                                                                     | 1.5 h | P4-06        |
| P4-10 | (Optional, cut first) Cloudflare Access second lock | Zero Trust app on `/admin*`, email-OTP to owner. Free ≤ 50 users; card-on-file caveat (Blueprint 12.5). Default: **skip** — OAuth + repo permissions already define the boundary                                                                                                                                                                                                                                                                           | +1 h  | P4-08        |

## 4.5 Implementation Notes

**Why the auth Worker is a separate deploy, not a Pages Function.** The Worker must present a stable, GitHub-registered callback URL that survives site rebuilds, and it can be reused if the site ever moves hosts. It also isolates the two secrets (client ID/secret) in Worker env bindings — the repo stays secret-free, honoring `docs/secrets.md`. `GITHUB_ALLOW_WORKFLOW_SCOPE` stays **unset** (the Worker's own docs describe it as granting broad powers; this CMS never needs to touch workflow files).

**Editorial workflow + branch protection co-exist.** Sveltia's editorial workflow creates PR branches — safe under P0's branch protection. The _publish_ action (merge) is a GitHub permission the owner has. Direct-commit collections would fail against protection (Sveltia's own docs note read-only behavior for protected branches outside the editorial workflow) — which is fine because every collection here uses the editorial workflow deliberately.

**Read-only files are a guardrail, not an inconvenience.** `projects.json` and `activity.json` are written by the P6 sync job via PRs. In `config.yml` they appear as `editor: { preview: false }` read-only entries (or are simply omitted from collections) so the owner cannot clobber the automation's source of truth — and, symmetrically, P6's override file is never written by automation (Blueprint 14.2's merge rule: _override wins, automation never writes overrides_).

**Media prefix discipline.** `prefix: cms-uploads/` (or similar) keeps CMS-uploaded media in one namespace inside the bucket — the gallery manifest references the public URL; a future CDN switch touches one YAML key (`public_url`), not content files.

## 4.6 Acceptance Criteria

- [ ] `/admin` loads (login with GitHub; **a non-collaborator GitHub account cannot log in** — tested with a second account or documented reasoning)
- [ ] All 6 collections editable; all 13 singletons editable; automation-owned files not editable (attempt proves it)
- [ ] Roundtrip proven for every collection: save → draft PR → preview URL renders → merge → production updated (link evidence in PRs)
- [ ] Photo upload → R2 → auto-WebP → renders on site; rename + delete work (CORS DELETE verified)
- [ ] Mobile pass: entire roundtrip performed on a phone for at least one book edit and one photo upload (this is the owner's real usage pattern)
- [ ] R2 Secret Access Key exists **nowhere** in the repo (`git log --all --oneline | grep` sanity + never typed into any config file — official security rule)
- [ ] Scoped admin CSP: CMS works with the site's strict CSP; console shows zero CSP violations
- [ ] Kill-switch + availability toggles in `site-config.yaml` / `chatbot-config.yaml` editable from the panel and take effect after merge
- [ ] `docs/owner-guide.md` complete; a non-technical reader can follow it without help

## 4.7 Definition of Done (Phase)

All acceptance boxes ticked · `admin/config.yml` reviewed against tech-specs §5.2 (it is the living contract; drift = bug) · secrets registry updated: OAuth client secret, R2 secret key entry (stored: "browser localStorage + Cloudflare dashboard", rotation: quarterly) · risk R1/R2 status recorded.

## 4.8 Exit Gate G4 — Owner Operable

| #   | Check                                                            | Verified by                    |
| --- | ---------------------------------------------------------------- | ------------------------------ |
| 1   | Auth: owner in, strangers out                                    | login matrix test              |
| 2   | Full roundtrip per collection incl. media, on mobile             | PR evidence                    |
| 3   | Config-as-content: theme/nav/seo/chatbot singletons all editable | form walk                      |
| 4   | Guardrails: read-only files, editorial PRs, no secrets in repo   | config review + git grep       |
| 5   | Owner guide readable by the owner                                | owner sign-off (or proxy test) |

## 4.9 Risks & Rollback

**R1 (setup friction)** has landed on many adopters — the documented trap is dashboard UI churn around account IDs and API tokens; the countermeasure is pinned here: use the CLI path, take account IDs from the dashboard URL string, and note that a _token-scoped_ API key is required for the Worker deploy, not the global API key. **R2 (CORS)** is fully specced — if uploads fail, diff the bucket CORS against tech-specs §5.4 before debugging anything else. **Rollback:** the CMS is a _UI over files_ (Blueprint 12.1's core verdict) — removing it means deleting `/admin` and the Worker; content, history, and the site are untouched. That disposability is the architecture's safety property.

**Changelog:** _(record actuals: hours, setup friction notes, version pinned)_

---

_Next phase: [`07-phase-5-resume-builder.md`](07-phase-5-resume-builder.md)_
