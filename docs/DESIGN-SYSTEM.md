# Design system

> "Intelligent minimalism with purposeful depth": a quiet surface, a technical
> grid, and depth that appears on interaction rather than at rest. This document
> is the working reference — the source of truth is `content/theme.yaml`.

## 1. Tokens

Every value below is generated into `src/styles/tokens.css` by
`scripts/tokens.mjs`. Components consume `var(--token)`; literals fail CI.

### Colour roles

| Token                           | Dark (default)        | Light                 | Use                 |
| ------------------------------- | --------------------- | --------------------- | ------------------- |
| `--bg`                          | `#0A0A0F`             | `#FAFBFC`             | page background     |
| `--surface`                     | `#12121A`             | `#FFFFFF`             | cards, inputs       |
| `--surface-elevated`            | `#1A1A2E`             | `#F0F2F5`             | bars, inset panels  |
| `--text`                        | `#E8E8ED`             | `#1A1A2E`             | body copy           |
| `--muted`                       | `#8888A0`             | `#5A5A7A`             | secondary copy      |
| `--accent`                      | `#7C74FF`             | `#4F46E5`             | links, active state |
| `--gradient-a` → `--gradient-b` | `#6C63FF` → `#00D4AA` | `#4F46E5` → `#00806A` | brand gradient      |
| `--border`                      | `#26263A`             | `#DDE1E7`             | hairlines           |

Two notes that matter:
1. **The interactive accent is lighter than the brand indigo.** `#6C63FF` measures
   4.32:1 on `--surface`, below the 4.5:1 floor. The gradient keeps the brand
   value for decoration; text and links use the readable tint.
2. **Contrast is checked, not eyeballed.** Ten pairs per palette, both modes, on
   every CI run (`scripts/check-contrast.mjs`).

### Type

Fluid `clamp()` roles, generated from the ratio selected in `theme.yaml`
(`editorial` = 1.333 by default). All values are rem-based so browser font-size
preferences scale the layout instead of being overridden.

| Token       | Range           | Use                           |
| ----------- | --------------- | ----------------------------- |
| `--step--1` | 0.85 → 0.97 rem | labels, meta, buttons         |
| `--step-0`  | 1 → 1.125 rem   | body (never below 16px)       |
| `--step-1`  | 1.33 → 1.67 rem | section headings, card titles |
| `--step-2`  | 1.78 → 2.33 rem | page titles                   |
| `--step-3`  | 2.37 → 3.55 rem | hero                          |

`h1–h3` use `text-wrap: balance`; paragraphs use `pretty`. Prose is capped at
68ch, inside the 45–75ch reading band. Dates and metrics use `tabular-nums`.

### Space, radius, shadow

- Spacing base is 4px (`--space-3xs` … `--space-4xl`), so every gap is a multiple.
- Radii: 6px elements, 16px cards, 9999px pills.
- Shadows are derived from a single `--shadow-color`, which flips with the theme.
- Motion: `--transition-fast` 140ms, `--transition-base` 260ms, both on a single
  `cubic-bezier(0.16, 1, 0.3, 1)` curve. `motion: none` in the theme disables
  transitions globally — an accessibility floor, not a taste setting.

## 2. Surfaces

- `.glass` — translucent surface, 18px backdrop blur, 9% text-tinted border. Used
  for the hero console, panels and the CTA band.
- `.card` — solid surface with a gradient hairline that fades in on hover/focus.
  The hairline is a masked pseudo-element, not a border, so it can be a gradient.
- `.tag` / `.badge` — mono, uppercase, pill. Status badges carry semantic colour
  (`live` success, `wip` warning, `archived` muted) and never rely on colour alone
  — the label is always present.

## 3. Layout

- One container: `--max-width` 1200px, fluid gutter 24–32px.
- Sections are separated by a single hairline; the page reads as a document, not
  a stack of boxes.
- Numbered section headers (`01 — Selected work`) are the structural device. The
  index sits in its own column, which is why the heading is inset from the left
  edge; keep it consistent.
- Grids collapse 3 → 2 → 1 at 1024 / 760 / below. Nothing is hidden at mobile
  except the desktop nav and the Résumé button (both available in the menu).

## 4. Components

| Component    | File                                    | Notes                                          |
| ------------ | --------------------------------------- | ---------------------------------------------- |
| Header       | `components/layout/Header.astro`        | sticky, glass, `<details>` mobile menu, no JS  |
| Footer       | `components/layout/Footer.astro`        | nav, socials, availability, deploy stamp       |
| Section head | `components/ui/SectionHead.astro`       | index + title + note                           |
| Project card | `components/projects/ProjectCard.astro` | featured variant switches to a two-column body |
| Post card    | `components/blog/PostCard.astro`        | date / read time / category / tags             |
| Buttons      | `global.css` (`.btn-*`)                 | primary gradient, ghost, text; 44px minimum    |
| Prose        | `global.css` (`.prose`)                 | headings, lists, code, tables, blockquotes     |

`docs/assets/home.png` is the current reference render.

## 5. Interaction and motion

- Hover is an affordance, never the only signal: every hover state has a focus
  equivalent.
- Scroll reveals use `animation-timeline: view()` behind `@supports`; where it is
  unsupported nothing is hidden. No IntersectionObserver, no JS.
- The theme toggle has two explicit states plus the OS default on first visit. The
  choice persists in `localStorage`; the init script is external, 0.3 KB, and runs
  before paint to avoid a flash.
- `prefers-reduced-motion: reduce` and `motion: none` both collapse animation to
  a 0.001ms duration.

## 6. Accessibility rules

- Skip link is the first tab stop; focus rings are visible everywhere.
- Touch targets ≥ 44×44px (buttons, nav, lightbox close, form controls).
- One `h1` per page; heading levels never skip.
- Forms: visible labels, errors linked by `aria-describedby`, inputs ≥ 16px.
- Images: schema requires alt text on photos; decorative SVG uses `aria-hidden`.
- Colour is never the only carrier of meaning — status text accompanies the dot.
- Theme palette is contrast-gated; the gate has a demonstrated failure in
  `docs/QUALITY.md`.

## 7. Changing the theme

```bash
# edit content/theme.yaml
npm run tokens          # regenerate tokens.css
npm run check:contrast  # fail early, with the pair and ratio
npm run dev
```

If a palette change fails contrast, change the palette. Lowering the threshold is
not a supported operation.
