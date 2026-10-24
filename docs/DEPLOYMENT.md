# Deployment

> Target: Cloudflare Pages, free tier, Git integration. The site is fully static;
> there is no build step that needs a secret.

## 1. First deploy

1. Push this repository to `github.com/naimul3103/Portfolio` (branch `main`).
2. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git** → select the repository.
3. Build settings:

   | Setting                | Value              |
   | ---------------------- | ------------------ |
   | Framework preset       | Astro              |
   | Build command          | `npm run build`    |
   | Build output directory | `dist`             |
   | Node version           | from `.nvmrc` (22) |
   | Root directory         | `/`                |

4. Environment variables (Production **and** Preview):

   | Name              | Value                          | Scope                  |
   | ----------------- | ------------------------------ | ---------------------- |
   | `PUBLIC_SITE_URL` | `https://naimul3103.pages.dev` | both                   |
   | `NODE_VERSION`    | `22`                           | both (belt and braces) |

5. Deploy. The first build produces 41 routes, including the Pagefind index.

> `PUBLIC_SITE_URL` is not a secret. It is the origin used for canonical URLs,
> OG tags, the sitemap and RSS. Setting it in Pages (rather than hard-coding it)
> is what makes a custom domain a one-variable change.

## 2. Previews

Every pull request gets a preview URL automatically. Use it for:
- reviewing UI changes at 360 / 768 / 1280 px;
- checking that a content edit renders (CMS saves are draft PRs);
- confirming that no draft post leaked (previews use the production draft rules).

## 3. Custom domain (optional)

1. Pages project → **Custom domains** → add `naimul.dev` (or similar).
2. Add the CNAME Cloudflare shows; wait for the certificate.
3. Update `PUBLIC_SITE_URL` to the new origin and redeploy.
4. Add a redirect from the old `*.pages.dev` host if you want one canonical URL.
5. Re-submit the sitemap in Search Console; old URLs keep working because the
   paths do not change.

Media URLs (`pub-*.r2.dev`) are independent of the site origin; changing the
domain does not require re-uploading images.

## 4. Headers and caching

`public/_headers` ships with the build and is applied by Pages:
- HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`,
  `Permissions-Policy`, and a strict CSP (`script-src 'self'`).
- `/admin/*` gets a separate, narrower policy plus `X-Robots-Tag: noindex`.
- `/_astro/*` is immutable for a year; `/og/*` for a week.

If a CSP rule breaks a feature, the emergency lever is one line: change
`Content-Security-Policy` to `Content-Security-Policy-Report-Only`, deploy, and
read the violations before narrowing the policy again.

## 5. Rollback

| Situation                 | Action                                                                                       |
| ------------------------- | -------------------------------------------------------------------------------------------- |
| Bad content               | `git revert <sha>` → push. Pages rebuilds in ~1 minute.                                      |
| Bad code                  | Redeploy the previous successful build from the Pages dashboard.                             |
| Broken theme              | Revert `content/theme.yaml`; `tokens.css` is committed, so the last good CSS is also in git. |
| Worker incident (Phase 6) | `wrangler rollback` in `worker/site-api`; the static site is unaffected.                     |

Because the site is static, a failure in any integration degrades content
freshness, not availability. That is the deliberate trade.

## 6. Environment files

| File           | Committed       | Contents                                  |
| -------------- | --------------- | ----------------------------------------- |
| `.env.example` | ✅              | documented variable names, no real values |
| `.env`         | ❌ (gitignored) | local values, including `PUBLIC_SITE_URL` |
| Pages env      | —               | production values, set in the dashboard   |

Nothing secret is ever prefixed `PUBLIC_`. A `PUBLIC_` value is inlined into the
client bundle by definition.

## 7. Post-deploy checklist

- [ ] `/` renders, dark and light
- [ ] `/projects`, `/blog`, `/notes`, `/about`, `/resume`, `/now`, `/contact` render
- [ ] `/rss.xml` validates
- [ ] `/sitemap-index.xml` lists every public page
- [ ] `/admin/` loads the CMS (after the OAuth worker exists)
- [ ] `securityheaders.com` grade A or better
- [ ] Lighthouse mobile: a11y ≥ 95, SEO = 100
- [ ] `node scripts/check-links.mjs` against a fresh build
