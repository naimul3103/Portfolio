# Secrets and configuration

> The public site has no secrets. Everything below belongs to the owner's
> toolchain, and the rule for all of it is the same: **never in the repository,
> never prefixed `PUBLIC_`.**

## 1. Registry

| Secret                   | Where it lives                    | Used by                    | Rotation                       |
| ------------------------ | --------------------------------- | -------------------------- | ------------------------------ |
| `PUBLIC_SITE_URL`        | Pages env                         | build (canonical, OG, RSS) | on domain change               |
| `PUBLIC_GITHUB_USERNAME` | `.env` local                      | optional build hints       | rarely                         |
| `GITHUB_CLIENT_ID`       | auth Worker encrypted env         | CMS OAuth                  | yearly                         |
| `GITHUB_CLIENT_SECRET`   | auth Worker encrypted env         | CMS OAuth                  | yearly, or on suspicion        |
| `ALLOWED_DOMAINS`        | auth Worker var                   | anti-abuse                 | when domains change            |
| R2 Access Key ID         | `admin/config.yml` (committed)    | CMS uploads                | quarterly                      |
| **R2 Secret Access Key** | **CMS UI → browser localStorage** | CMS uploads                | quarterly                      |
| `GROQ_API_KEY`           | Worker encrypted env              | assistant                  | quarterly                      |
| `TURNSTILE_SECRET`       | Worker encrypted env              | chat + contact             | quarterly                      |
| `RESEND_API_KEY`         | Worker encrypted env              | contact form               | quarterly                      |
| `CLOUDFLARE_API_TOKEN`   | GitHub Actions secret             | Worker deploy              | yearly, scoped to Workers only |
| `SENTRY_DSN`             | Worker env                        | error reporting            | rarely                         |

## 2. Hard rules

1. **No secret in `content/`, `public/`, or any file tracked by git.** The CMS
   config is public by definition — only the non-secret Access Key ID is allowed
   there.
2. **No secret in a `PUBLIC_` variable.** Astro inlines those into the client
   bundle; a `PUBLIC_` secret is a published secret.
3. **The R2 secret key is never written to `config.yml`.** Sveltia's own docs say
   so in as many words; it is entered once in the UI and kept in the browser.
4. **Worker secrets are set with `wrangler secret put`,** never in `wrangler.toml`.
5. **Cloudflare API tokens are scoped.** The deploy token needs Workers Scripts
   edit on one account — nothing else.

## 3. Local development

```bash
cp .env.example .env
# fill in PUBLIC_SITE_URL and PUBLIC_CONTACT_EMAIL only
```

`.env` is gitignored. Local development needs no provider keys: the contact form
falls back to `mailto:`, and the assistant is disabled by `chatbot-config.yaml`.

## 4. Rotation procedure

1. Create the new key at the provider.
2. Update it in the one place listed above (`wrangler secret put` or the CMS UI).
3. Deploy the Worker if it reads the value at boot.
4. Verify the feature (one upload, one chat message, one email).
5. Revoke the old key.
6. Note the date in the table above via a small PR — the audit trail is the point.

## 5. If a secret leaks

1. Revoke it first, investigate second. A revoked key cannot be used while you
   read logs.
2. Rotate every credential that shared the exposure (same shell history, same
   `.env`).
3. Check provider logs for use from unfamiliar IPs.
4. If it reached git history: rotate, then rewrite history only if the repo is
   private — for a public repo, assume it was cloned and treat rotation as the
   fix. Never rely on deleting the commit.
5. Record the incident and the fix in `docs/CHANGELOG.md`.

## 6. What is deliberately public

| Public by design                       | Why it is safe                                          |
| -------------------------------------- | ------------------------------------------------------- |
| All site content, résumé, case studies | the point of the site                                   |
| `content/data/projects.json`           | public GitHub data                                      |
| Turnstile **site** key                 | it is a client-side key by design                       |
| R2 Access Key ID                       | an identifier, not a credential; the secret is separate |
| Repository history                     | reviewable work is the portfolio's argument             |
