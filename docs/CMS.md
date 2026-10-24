# CMS — editing without a terminal

> Sveltia CMS, self-hosted bundle, GitHub backend, editorial workflow. Every save
> becomes a **draft pull request**; merging is the publish step.

## 1. What is already in the repo

| Piece                  | Location                                               | State                                 |
| ---------------------- | ------------------------------------------------------ | ------------------------------------- |
| CMS UI shell           | `public/admin/index.html`                              | shipped                               |
| Self-hosted bundle     | `public/admin/sveltia-cms.js` (2.5 MB, pinned 0.251.0) | vendored                              |
| Collection definitions | `public/admin/config.yml`                              | shipped, mirrors every schema         |
| CSP for `/admin`       | `public/_headers`                                      | narrow, separate from the public site |

The bundle is vendored rather than loaded from a CDN so that `/admin` can keep
`script-src 'self'`. To upgrade:

```bash
npm run vendor:admin          # re-downloads the pinned version in scripts/vendor-admin.mjs
git diff --stat public/admin/sveltia-cms.js
```

## 2. Three placeholders to replace

`public/admin/config.yml` contains:

```yaml
backend:
  base_url: https://<auth-worker>.workers.dev
media_libraries:
  cloudflare_r2:
    access_key_id: <access-key-id>
    account_id: <account-id>
    public_url: https://pub-<hash>.r2.dev
```

Everything else works as-is.

## 3. The OAuth worker (one-time, ~20 minutes)

Sveltia's GitHub backend needs a small OAuth exchange service, because a browser
cannot hold a client secret.
1. GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**
   - Homepage: `https://naimul3103.pages.dev`
   - **Authorization callback URL:** `https://<auth-worker>.workers.dev/callback`
     — the worker's callback, _not_ the site's `/admin`.
2. Deploy the official worker:

   ```bash
   git clone https://github.com/sveltia/sveltia-cms-auth
   cd sveltia-cms-auth
   npx wrangler deploy
   npx wrangler secret put GITHUB_CLIENT_ID
   npx wrangler secret put GITHUB_CLIENT_SECRET
   npx wrangler secret put ALLOWED_DOMAINS     # naimul3103.pages.dev
   ```

3. Copy the worker URL into `base_url` in `config.yml`.
4. Do **not** set `GITHUB_ALLOW_WORKFLOW_SCOPE`. A CMS never needs to edit
   workflows.

`ALLOWED_DOMAINS` is anti-abuse: without it, another site could point at your
worker and obtain a token for your repo.

## 4. R2 media (one-time, ~15 minutes)

1. Create a bucket `portfolio-media`.
2. Create an R2 API token scoped to that bucket (Object Read & Write).
3. Note the **Access Key ID** (non-secret, goes in `config.yml`) and the
   **Secret Access Key** (entered once in the CMS UI, stored in the browser —
   never in the repo, never in an environment variable that reaches the client).
4. Add the bucket CORS policy:

   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "DELETE", "HEAD"],
       "AllowedOrigins": ["https://naimul3103.pages.dev"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3000
     }
   ]
   ```

   `DELETE`, `ETag` and wildcard headers are required for rename/delete in the
   asset library.
5. `public_url` starts as `https://pub-<hash>.r2.dev` (rate-limited, dev-grade).
   At launch, attach `media.<domain>` to the bucket and change one line.

## 5. What the owner sees

| Collection    | Shape                 | Notes                                                         |
| ------------- | --------------------- | ------------------------------------------------------------- |
| Writing       | folder, MDX           | draft toggle, category, tags, AI disclosure                   |
| Notes         | folder, MD            | status: seedling → evergreen                                  |
| Projects      | folder, MD            | outcomes list enforces metric + method; 80-char honesty field |
| Gallery       | folder, MD            | alt text is required by the widget                            |
| Reading list  | one file, list widget | spreadsheet-style editing                                     |
| Screen time   | one file, list widget | empty is valid                                                |
| Page copy     | files                 | home, about, now, contact, lab, gallery, writing, projects    |
| Site settings | files                 | theme, navigation, identity, SEO, assistant copy              |
| Résumé        | files                 | JSON Resume + template switch                                 |
| Synced data   | files, read-only      | GitHub snapshot; never hand-edited                            |

Field labels match the site's vocabulary, not the schema's. If a field is
confusing to fill, the widget is wrong — fix the widget.

## 6. Editorial workflow

```text
Save → branch + draft PR (prefix: cms/)
     → Pages preview URL on the PR
     → review on the preview (360px first)
     → merge  → rebuild → live
```

Nothing auto-merges. Automation (the sync job) opens PRs too, and the human merge
is the only path to `main`.

## 7. Troubleshooting

| Symptom                        | Cause                                          | Fix                                       |
| ------------------------------ | ---------------------------------------------- | ----------------------------------------- |
| Login redirects to a 404       | callback URL is the site, not the worker       | update the GitHub OAuth app               |
| "Not allowed" from the worker  | `ALLOWED_DOMAINS` missing the preview host     | add `*.pages.dev` if previews need login  |
| Media upload 403               | CORS missing `PUT` or the origin               | re-apply the CORS JSON                    |
| Uploads succeed but images 404 | `public_url` points at the wrong bucket/domain | check the `pub-<hash>` host               |
| Field missing in the UI        | `config.yml` out of sync with the schema       | field-for-field rule: change both         |
| CMS loads a blank page         | bundle path wrong, or CSP blocked it           | check `/admin/sveltia-cms.js` returns 200 |
