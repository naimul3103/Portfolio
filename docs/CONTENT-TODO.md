# Content checklist before going live

> Everything here is either a fact that needs the owner's confirmation or an
> integration that needs a credential. Nothing else is outstanding.

## 1. Facts to confirm

| #   | Item                           | Current state                                                                                                                                    | Action                                                                                         |
| --- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| 1   | University and graduation year | `Daffodil International University`, `B.Sc. CSE`, 2026 — inferred from the `1_umbrella` README (CSE414 Mobile Application Design Lab, team list) | Confirm the degree title and year in `content/resume.json` and `content/timeline.yaml`         |
| 2   | City                           | `Dhaka, Bangladesh` in the résumé, `Bangladesh` on the site                                                                                      | Confirm or change both                                                                         |
| 3   | Phone number                   | omitted                                                                                                                                          | Add to `resume.json` `basics.phone` if you want it on the CV                                   |
| 4   | Certifications                 | none listed                                                                                                                                      | Add real ones to `resume.json` `certificates`; do not add courses you did not finish           |
| 5   | Reading list                   | four books, two in progress                                                                                                                      | Confirm or replace; the About page renders them as a table                                     |
| 6   | `/now`                         | dated 2026-10-24                                                                                                                                 | Refresh monthly; the page shows its own age and flags staleness after 45 days                  |
| 7   | Photo                          | none used                                                                                                                                        | The hero is typographic by design. If you add one, use a real, well-lit photo — no AI portrait |
| 8   | Project facts                  | verified 2026-10-24 from repos and a model artefact                                                                                              | Re-verify if you change the repos; the case studies quote specific numbers                     |

## 2. Integrations to enable

| Integration   | Blocked on                                                        | Where                                 |
| ------------- | ----------------------------------------------------------------- | ------------------------------------- |
| CMS login     | OAuth worker deploy + callback URL                                | `docs/CMS.md` §3                      |
| Media uploads | R2 bucket, token, CORS                                            | `docs/CMS.md` §4                      |
| Contact form  | Worker deploy + Turnstile + Resend keys                           | `worker/site-api` (Phase 6)           |
| AI assistant  | Worker deploy + Groq key; flip `chat: true` and `chatbot.enabled` | `docs/ARCHITECTURE.md`                |
| Comments      | public repo + Discussions category + giscus app                   | `site-config.yaml` → `flags.comments` |
| Analytics     | Cloudflare Web Analytics token                                    | `BaseLayout.astro`                    |
| Uptime        | monitor on `/` and `/rss.xml`                                     | external                              |
| Custom domain | purchase + DNS                                                    | `docs/DEPLOYMENT.md` §3               |

## 3. Copy that is intentionally honest

These are not placeholders. Do not "improve" them into claims the work does not
support:
- The lab notice says the demos run locally and are not deployed.
- The gallery is empty and says so.
- The template-derived precision@50 is **not** presented as the owner's result.
- The data-structures repo is described as a working directory, not a curated
  project.
- The Android project states "3 of 17 commits"; the PHP project names its team.
- The FastAPI service is labelled `wip` because its store is a mock.

## 4. Before the first public post

- [ ] `PUBLIC_SITE_URL` set to the real origin
- [ ] Email in `site-config.yaml` is the one you want public
- [ ] LinkedIn and GitHub URLs resolve
- [ ] `npm run build && node scripts/check-links.mjs` clean
- [ ] Lighthouse mobile: a11y ≥ 95, SEO = 100
- [ ] OG card renders in a link preview (Slack/Discord/LinkedIn)
- [ ] `securityheaders.com` grade A or better
