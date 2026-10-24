# Backlog

> New ideas do not enter the current phase. They land here, and get triaged when a
> phase gate is reviewed. This file is why the scope stays honest.

## Next (ordered)

1. **Worker deployment** — contact endpoint first (Turnstile + Resend), then the
   assistant (retrieval over the built site, refusal tests, kill switch).
2. **Playwright + axe** — one smoke test per route, zero critical violations,
   keyboard pass on the gallery dialog and résumé toggle.
3. **Lighthouse CI** — encode LCP ≤ 2.5s, CLS ≤ 0.1, SEO = 100 as assertions.
4. **Photo pipeline** — `astro:assets`, AVIF/WebP presets, LQIP placeholders, R2
   remote patterns; then populate the gallery.
5. **giscus** — create the Discussions category, set `flags.comments: on`.
6. **Analytics + uptime** — Cloudflare Web Analytics; one monitor on `/` and
   `/rss.xml`.
7. **`/now` heartbeat** — a scheduled commit that refreshes the date, so staleness
   is a system property rather than a memory exercise.

## Later

- Per-page OG cards for case studies (currently one shared card).
- Search filters by content type (`data-pagefind-filter`), once there are enough
  documents for filtering to help.
- A `/uses` page (hardware, editor, fonts) — only if it says something the rest of
  the site does not.
- Pagination for the blog, when posts exceed twelve.
- An RSS "notes only" feed, if notes become the primary stream.
- Europass PDF via Typst in Actions; print CSS already works.

## Considered and rejected

| Idea                       | Why not                                              |
| -------------------------- | ---------------------------------------------------- |
| A client framework / SPA   | 3.2 KB of JS already covers every interaction        |
| Server-side rendering      | no per-user state; adds a runtime for nothing        |
| Newsletter                 | the site's job is interviews; RSS covers peers       |
| Full i18n                  | doubles the content surface with no evidence of need |
| A/B testing                | not enough traffic to reach significance             |
| PWA / offline              | a portfolio is visited once, from a link             |
| AI-generated portrait      | the fastest way to lose an interview                 |
| Testimonials without names | unverifiable praise is worse than none               |
