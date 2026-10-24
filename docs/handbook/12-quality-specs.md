# 12 — Quality Specifications

> **Portfolio Production Handbook v2.0 — the bar that "done" must clear.** Phase 7 executes this file; the CI jobs in [`11-tech-specs.md`](11-tech-specs.md) §9 enforce it mechanically. Budgets are **ceilings that fail PRs**, not aspirations. Sources: Blueprint v4 Parts 10, 15.5–15.8, verified October 2026.

---

## §1 — Quality Gates Summary (who checks what, when)

| Gate                       | Checked at       | Tools                                     | Fail behavior                           |
| -------------------------- | ---------------- | ----------------------------------------- | --------------------------------------- |
| Lint/format                | every PR         | `biome check`                             | red PR                                  |
| Theme contrast             | every PR         | `scripts/check-contrast.mjs`              | red PR with plain-language pair report  |
| No hard-coded styling/copy | every PR         | `scripts/check-no-hex.mjs` + string audit | red PR                                  |
| Types + templates          | every PR         | `astro check`                             | red PR                                  |
| Content schema strictness  | every PR (build) | zod `.strict()`                           | build fails on unknown/malformed fields |
| Unit/derivation tests      | every PR         | Vitest                                    | red PR                                  |
| E2E + a11y assertions      | every PR         | Playwright + axe-playwright               | red PR                                  |
| Performance budgets        | every PR         | LHCI                                      | red PR                                  |
| Broken links               | every PR         | lychee (on `dist/`)                       | red PR (allowlist documented)           |
| Security headers           | P7 + quarterly   | securityheaders.com scan                  | launch-blocker                          |
| Uptime/error monitors      | continuous       | UptimeRobot + Sentry                      | alert to owner                          |

## §2 — Security

### §2.1 `public/_headers` (exact file — P7 ships this; enforce after report-only week)

```text
/*
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: DENY
  Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
  Content-Security-Policy: default-src 'self'; script-src 'self' https://challenges.cloudflare.com https://static.cloudflareinsights.com <sha256-of-theme-init-script>; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://pub-<hash>.r2.dev https://media.<domain> https://customer-<id>.cloudflarestaging.com; font-src 'self'; connect-src 'self' https://challenges.cloudflare.com https://cloudflareinsights.com https://api.github.com https://<auth>.workers.dev; frame-src https://challenges.cloudflare.com https://giscus.app; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'

/admin/*
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://pub-<hash>.r2.dev; connect-src 'self' https://api.github.com https://<auth>.workers.dev https://<account>.r2.cloudflarestorage.com https://pub-<hash>.r2.dev; object-src 'none'; base-uri 'self'
```

### §2.2 CSP engineering notes

- `style-src 'unsafe-inline'` — Astro inlines small component styles; styles are low-risk (no script execution); locking further adds build complexity without security payoff. Revisit if threat model changes.
- `script-src` — the only inline script is the ≤ 1 KB dark-mode initializer (P1-08); hash it at build (script emits the hash into `_headers`). Turnstile + CWA are the only third-party scripts; giscus runs in an **iframe** (`frame-src`), not script-src on the host page.
- **Rollout law:** ship as `Content-Security-Policy-Report-Only` → 7 violation-free days logged in `docs/csp-log.md` → remove `-Report-Only`. Emergency exit: revert to Report-Only is a one-line change (P7-02).
- Supply chain: Dependabot **alerts** on; Actions pinned by SHA (checkout, setup-node, create-pull-request…); npm deps pinned where runtime-shaping (Sveltia, Typst template, satori) — Part 10.1.

### §2.3 Threat model (one paragraph, honestly bounded)

Public by design: all site content, the KB, R2 media, repo history. Secret: LLM/email/Turnstile keys (Worker env), OAuth secrets (auth Worker env), R2 secret key (browser localStorage + CF dashboard — never config/repo). Attack surfaces worth engineering: (1) form/chat quota abuse → Turnstile + KV caps; (2) prompt injection → no tools, system prompt never executes user input, refusal tests in CI; (3) OAuth Worker abuse → `ALLOWED_DOMAINS` (anti-abuse is a documented feature of the auth worker); (4) stale-dependency CVEs → Dependabot + pins. Not worth engineering at this scale (state why in review): DDoS (Cloudflare free absorbs), scraping (content is public), session attacks (no sessions exist).

## §3 — Performance Budgets (LHCI assertions)

| Metric                                           | Budget (mobile, production, PR preview)                                                                           | Rationale                                                                                |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| LCP                                              | ≤ **2.5 s**                                                                                                       | CWV "good"; prebuilt HTML + CDN makes this achievable without heroics                    |
| CLS                                              | ≤ **0.1**                                                                                                         | Skeletons + reserved island boxes (Blueprint 15.6 rules)                                 |
| INP                                              | ≤ **200 ms** @ p75                                                                                                | CWV since Mar 2024 (Part 10.4) — islands barely ship JS, so this is headroom, not strain |
| First-party JS, worst page (home + chat trigger) | ≤ **60 KB gzip**                                                                                                  | The explicit hydration budget (Blueprint 15.8)                                           |
| Per-page JS by class                             | hero 0 KB pre-open · content pages ≤ 5 KB · chatbot ≤ 60 KB lazy · search ≤ 30 KB lazy · gallery lightbox ≤ 10 KB | Island ledger — new islands require a budget line + review                               |
| Page weight, `/` first view                      | ≤ 500 KB transfer                                                                                                 | AVIF/WebP + subset variable fonts (≤ 120 KB total)                                       |
| Fonts                                            | ≤ 2 woff2 files, ≤ 120 KB, `font-display: swap`, unicode-range subsets                                            | Blueprint 15.5 mechanism                                                                 |
| Images                                           | AVIF/WebP, ≤ 100 KB hero/cover, LQIP placeholders                                                                 | build-time transforms, no runtime CDN (Part 10.4)                                        |
| Build time                                       | < 3 min (P2), alert at 4, act at 5                                                                                | Risk R5 tripwire                                                                         |
| Lighthouse categories                            | perf ≥ 90 · a11y ≥ 95 · best-practices ≥ 95 · **SEO = 100**                                                       | recorded per release in `docs/launch.md`                                                 |

**Hydration directives:** `client:visible` is the default; `client:load` needs a PR-template justification; `client:idle` for below-fold niceties. Every island reserves its layout box (no CLS on hydration).

## §4 — Testing Strategy

| Layer                   | Tool                               | What it locks down                                                                                                           | Runs                                |
| ----------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| Schema/derivation units | Vitest                             | slug/date/duration derivations, overrides-merge (automation never clobbers owner), draft exclusion, resume mapper edge cases | PR                                  |
| Guard scripts           | node                               | contrast gate, hex-lint, (P2) strict-schema build                                                                            | PR                                  |
| E2E smoke               | Playwright                         | every route 200s + nav works + dark mode + search finds fixture term + resume renders both templates + 404                   | PR                                  |
| Behavior contract       | Playwright (mocked LLM)            | chatbot: greeting, KB answer, injection battery (5 prompts → refusals), 429 limit card, 503 kill-switch card, fallback card  | PR                                  |
| A11y                    | axe-playwright (+ manual pass, P7) | zero critical/serious on all routes; 44px targets; focus order                                                               | PR (auto) + P7 (manual SR/keyboard) |
| Links/HTML              | lychee + html-validate             | internal + external links, structure                                                                                         | PR                                  |
| Perf                    | LHCI                               | §3 budgets                                                                                                                   | PR                                  |
| DR drill                | human                              | restore measured (P7-09, runbook §13.5)                                                                                      | quarterly                           |

**Testing philosophy, stated once:** static-first means most bugs are _build_ bugs (schema, links, budgets) — the suite concentrates there; the only runtime logic is three Worker endpoints and the chat island, which get the mocked contract tests. The mocked LLM rule (Part 10.5) is absolute: **CI never calls a live provider** — tests are deterministic, free, and fail for the right reasons.

## §5 — SEO Specification

| Item             | Rule                                                                                                                                                                                                                                      |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Title patterns   | Home: `Name — AI/ML & Software Engineer` · Projects: `Projects — Name` · Post: `<Post title> — Name` · Resume: `Hire Name — Resume (PDF)`; per-page overrides via `seo.yaml` **win over patterns**                                        |
| Meta description | `.max(180)` enforced at schema; page-specific, never templated filler                                                                                                                                                                     |
| Canonical        | one canonical URL per page, from `site_url` — after P8 domain change, old URLs 301 via `_redirects`                                                                                                                                       |
| Structured data  | Person JSON-LD (home, `sameAs` = GitHub + LinkedIn, `knowsAbout` from skills); BlogPosting per post (`headline`, `datePublished/Modified`, author→Person, image→OG card); validated via Rich Results test at P7 + after any domain change |
| Feeds/sitemap    | `/rss.xml` (30 newest blog+notes) + `/sitemap-index.xml` + `robots.txt` referencing sitemap; lastmod from content dates                                                                                                                   |
| OG/Twitter       | every page: og:title/description/image (Satori card from `theme.yaml` tokens — cards and site never disagree); `og:type=article` on posts                                                                                                 |
| Verification     | Search Console + Bing Webmaster verified at P3; sitemap submitted; coverage reviewed in monthly ritual                                                                                                                                    |
| The honest rule  | no keyword stuffing, no hidden text — the site's SEO is static HTML + real content + one identity block; that is the whole strategy (Part 10.2)                                                                                           |

## §6 — UX State Matrix (required for every dynamic surface — Blueprint 15.6)

| Surface           | Loading                             | Empty                                      | Error                                              | Success                           |
| ----------------- | ----------------------------------- | ------------------------------------------ | -------------------------------------------------- | --------------------------------- |
| Chatbot           | streaming placeholder + `aria-live` | greeting + suggested chips (config copy)   | "AI is resting — email me" card + mailto           | reply + follow-up chips           |
| Search (Pagefind) | instant (local index)               | "No hits — try fewer words" (CMS-editable) | n/a (client-side)                                  | count + highlighted matches       |
| Comments (giscus) | skeleton rows                       | "Be the first — comment on GitHub"         | auth-failure note + retry                          | comment appears; GitHub-moderated |
| Contact form      | button pending state                | n/a                                        | inline field errors + Resend retry                 | "Sent — reply within 24 h"        |
| Gallery           | LQIP blurred thumbs                 | "Photos coming soon" (CMS-editable)        | broken image → styled placeholder, alt text always | lightbox with EXIF story          |
| Activity feed     | static snapshot renders immediately | "First activity lands soon"                | stale data + honest "last synced" badge            | automatic                         |

**Laws:** skeletons over spinners (they preserve CLS); feedback within 100 ms (Norman + INP are the same law); empty states are content in the site's voice, CMS-editable, offering a next action. All custom widgets: keyboard-operable + `aria-live` + `prefers-reduced-motion` respected.

## §7 — Accessibility (WCAG 2.2 AA — checklist used at P7 + PR template)

- [ ] Skip-to-content link first in tab order; visible focus ring everywhere (never `outline: none`)
- [ ] Landmarks: `header/nav/main/footer` + one `h1` per page; heading levels never skip
- [ ] Keyboard: menu, lightbox (ESC + focus return), chatbot (focus in input on open), filters, resume tabs all operable; no keyboard traps
- [ ] Alt text: human-written on all photos (`.min(10)` schema-enforced); decorative images `alt=""`
- [ ] Contrast: token pairs gated in CI (4.5:1 text; 3:1 large text/UI); gradient text fails → text wins
- [ ] Motion: `prefers-reduced-motion: reduce` disables all animation + hides decorative canvases (P1-04 CSS); `motion: none` theme level = same floor
- [ ] Touch targets ≥ 44×44 px (Laws-of-UX row, Blueprint 15.4)
- [ ] Forms: labels on every field, error text linked via `aria-describedby`, input font ≥ 16px (no iOS zoom)
- [ ] `aria-live="polite"` on streaming chat replies and form success; announcements tested with a SR once
- [ ] axe-core: zero critical/serious — CI-enforced, not self-attested

## §8 — Observability & Error Budget

| Signal                           | Tool                                                                       | Cadence                          | Owner action                                              |
| -------------------------------- | -------------------------------------------------------------------------- | -------------------------------- | --------------------------------------------------------- |
| Uptime (`/`, `/api/chat` health) | UptimeRobot free 50 (personal ToS) / BetterStack free 10 (commercial-safe) | 5-min checks                     | alert → runbook §13.3                                     |
| Worker errors + traces           | Sentry free 5k events/mo                                                   | real-time                        | alert email; weekly digest skim                           |
| Traffic + referrers              | Cloudflare Web Analytics (cookieless)                                      | daily-ish glance, monthly ritual | Part 15.9 loop                                            |
| Search queries                   | Search Console                                                             | monthly ritual                   | "which queries bring recruiters" — the only honest source |
| Build health                     | Pages notifications + CI badges                                            | per deploy                       | failed main build = P1 incident (runbook)                 |
| Quota burn                       | Worker/Groq dashboards                                                     | monthly ritual                   | near-limit → caps tighten before breakage                 |

**Monthly analytics → action ritual (30 min, calendarized in runbook §13.6):** read Search Console top queries/pages + CWA top referrers → one content PR: pin the performing post, fix high-impressions/low-clicks titles (via `seo.yaml` — no redesign), refresh `/now` if stale. The ritual's output is a commit, not a meeting.

**Error posture:** a static site cannot go down because an integration did — worst realistic incident is _stale content_, flagged honestly by the "last synced" badge, never hidden (Part 10.6). There is no formal error budget at this scale; the 7-day green launch watch + monthly quota check is the honest equivalent.

---

_Return to: [`01-execution-plan.md`](01-execution-plan.md) · Mechanisms: [`11-tech-specs.md`](11-tech-specs.md) · Operations: [`13-operations-runbook.md`](13-operations-runbook.md)_
