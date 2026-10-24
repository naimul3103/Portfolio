<!-- Keep it short. The diff shows the what; this shows the why. -->

## What

<!-- One or two sentences. Link the issue or task id if there is one. -->

## Why

<!-- The problem this solves, or the decision this records. -->

## Checks

- [ ] `npm run check:content` passes (content contract, contrast, no hex)
- [ ] `npm run check` passes
- [ ] `npm run test` passes
- [ ] `npm run build` passes and `check-links` is clean
- [ ] Screenshot at 360px and 1280px (UI changes)
- [ ] Keyboard pass on any new interactive element
- [ ] No new JavaScript, or the budget impact is stated below

**JS budget impact:** <!-- e.g. +0.4 KB gzip, total now 3.6 KB -->

## Docs

- [ ] Schema change → `docs/CONTENT-MODEL.md` and `public/admin/config.yml` updated together
- [ ] Behaviour change → relevant doc updated in this PR
- [ ] New page → added to the route registry in `scripts/check-content.mjs`
