# Contributing

> A team of one still benefits from rules. These are the rules this repository is
> built on.

## Branches

`main` is always deployable. Work happens on short-lived branches:

```text
feat/project-filters
fix/resume-print-margin
content/rewrite-skill-tracker
docs/cms-oauth
```

## Commits — Conventional Commits

```text
feat: add stack filter pages
fix: prevent console overflow on 390px
content: correct the diabetes hold-out description
docs: document R2 CORS
chore: bump astro to 5.18.2
test: cover override merge on refresh
ci: add link checker
```

The history is part of the portfolio. A reviewer will read it.

## Before opening a pull request

```bash
npm run check:content   # content contract, contrast, no hex
npm run check           # types and templates
npm run test            # unit suite
npm run build           # schema validation + build
node scripts/check-links.mjs
```

## Pull request rules

- Under ~400 lines of diff. If it is bigger, split it.
- UI changes include a screenshot at 360px and 1280px.
- A schema change updates three files: the schema, `public/admin/config.yml`, and
  `docs/CONTENT-MODEL.md`.
- A new page is added to the route registry in `scripts/check-content.mjs`.
- A new island gets a budget line in `docs/QUALITY.md` before it gets code.
- A new colour goes in `content/theme.yaml` and must pass contrast in both modes.

## Content rules

1. **Earn the adjective.** If a sentence says "fast", "robust" or "production-grade",
   it needs a number or it gets cut.
2. **Name the method.** A metric without a measurement method is a rumour.
3. **Never claim a template's result.** If a benchmark came from a starter repo,
   say so, or leave it out.
4. **Say what you would change.** The 80-character minimum is a floor, not a target.
5. **No invented personal facts.** Hobbies, certifications and photos are the
   easiest things to fake and the first things an interviewer asks about.

## Code rules

- TypeScript strict; no `any` without a comment explaining the boundary.
- No colour literals in `src/`; tokens only.
- Prefer CSS to JavaScript. If JS is needed, it must be under 2 KB and explain
  itself in a comment.
- Every module that encodes a rule gets a test — merge rules, derivations,
  mappings.
- Comments explain _why_, not _what_. The diff shows the what.
