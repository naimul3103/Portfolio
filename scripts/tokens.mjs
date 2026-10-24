#!/usr/bin/env node
/**
 * tokens.mjs — compiles content/theme.yaml into src/styles/tokens.css.
 *
 * Why a build step instead of hand-written CSS: the theme is content. The owner
 * can retheme the whole site by editing one YAML file in the CMS, and the
 * generated CSS is committed so a broken script can never leave the site
 * unstyled (last-known-good stays in git).
 *
 * Run: npm run tokens   (also runs automatically in prebuild)
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const themePath = join(root, 'content/theme.yaml');
const outPath = join(root, 'src/styles/tokens.css');

const hex = /^#[0-9a-fA-F]{6}$/;
const theme = parse(readFileSync(themePath, 'utf8'));

function fail(message) {
  console.error(`\n✖ theme.yaml — ${message}\n`);
  process.exit(1);
}

if (!theme?.dark || !theme?.light) fail('both a `dark:` and a `light:` palette are required');

for (const mode of ['dark', 'light']) {
  const palette = theme[mode];
  for (const key of ['background', 'surface', 'elevated', 'text', 'muted', 'accent']) {
    if (!hex.test(palette?.[key] ?? '')) fail(`${mode}.${key} must be a 6-digit hex colour`);
  }
  if (!Array.isArray(palette.accent_gradient) || palette.accent_gradient.length !== 2) {
    fail(`${mode}.accent_gradient must be a two-colour array`);
  }
  for (const stop of palette.accent_gradient) {
    if (!hex.test(stop)) fail(`${mode}.accent_gradient contains an invalid hex colour`);
  }
}

const base = Number(theme.spacing) === 8 ? 8 : 4;
const space = (n) => `${n * base}px`;
const scale = {
  editorial: 1.333,
  modular: 1.25,
  compact: 1.2,
}[theme.type_scale ?? 'editorial'];

if (!scale) fail('type_scale must be one of: compact | modular | editorial');

/**
 * Fluid type roles. The clamp() maths is generated from the chosen ratio so the
 * three curated scales stay honest instead of three hand-tuned copies.
 * rem-based on purpose: user font-size preferences scale the whole layout.
 */
function clampStep(step, minRem = 1, maxVw = 1.6) {
  const min = minRem * scale ** step;
  const max = min * maxVw;
  const slope = ((max - min) * 16) / (1280 - 360);
  const intercept = min * 16 - slope * 360;
  const fmt = (n) => Number(n.toFixed(4));
  return `clamp(${fmt(min)}rem, ${fmt(intercept / 16)}rem + ${fmt((slope / 16) * 100)}vw, ${fmt(max)}rem)`;
}

function paletteBlock(mode) {
  const p = theme[mode];
  return `  /* ${mode} mode */
  --bg: ${p.background};
  --surface: ${p.surface};
  --surface-elevated: ${p.elevated};
  --text: ${p.text};
  --muted: ${p.muted};
  --accent: ${p.accent};
  --gradient-a: ${p.accent_gradient[0]};
  --gradient-b: ${p.accent_gradient[1]};
  --border: ${p.border};
  --success: ${p.success};
  --warning: ${p.warning};
  --danger: ${p.danger};
  --accent-soft: color-mix(in oklab, ${p.accent} 14%, transparent);
  --glass: color-mix(in oklab, ${p.surface} 72%, transparent);
  --glass-border: color-mix(in oklab, ${p.text} 9%, transparent);
  --shadow-color: ${mode === 'dark' ? 'rgb(0 0 0 / 0.55)' : 'rgb(26 26 46 / 0.12)'};`;
}

const css = `/* ─────────────────────────────────────────────────────────────────────────────
   GENERATED FILE — do not edit by hand.
   Source: content/theme.yaml   Generator: scripts/tokens.mjs   Run: npm run tokens
   ───────────────────────────────────────────────────────────────────────────── */
:root {
  color-scheme: dark;
${paletteBlock('dark')}

  /* Typography — fluid roles, rem-based, generated from ${theme.type_scale} ratio */
  --step--1: ${clampStep(-1, 0.85, 1.14)};
  --step-0: ${clampStep(0, 1, 1.125)};
  --step-1: ${clampStep(1, 1, 1.25)};
  --step-2: ${clampStep(2, 1, 1.4)};
  --step-3: ${clampStep(3, 1, 1.5)};
  --step-4: ${clampStep(4, 1, 1.55)};
  --font-sans: "${theme.fonts.sans}", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-mono: "${theme.fonts.mono}", ui-monospace, "SF Mono", Menlo, monospace;

  /* Spacing */
  --space-3xs: ${space(1)};
  --space-2xs: ${space(2)};
  --space-xs: ${space(3)};
  --space-sm: ${space(4)};
  --space-md: ${space(6)};
  --space-lg: ${space(8)};
  --space-xl: ${space(12)};
  --space-2xl: ${space(16)};
  --space-3xl: ${space(24)};
  --space-4xl: ${space(32)};

  /* Radii */
  --radius-sm: ${theme.radii.element}px;
  --radius-md: ${theme.radii.card}px;
  --radius-lg: ${theme.radii.card + 8}px;
  --radius-pill: ${theme.radii.pill}px;

  /* Layout */
  --max-width: ${theme.layout.max}px;
  --content-width: ${theme.layout.content}px;
  --gutter: ${space(5)};

  /* Shadows & motion */
  --shadow-sm: 0 1px 2px var(--shadow-color);
  --shadow-md: 0 12px 32px -12px var(--shadow-color);
  --shadow-lg: 0 32px 64px -24px var(--shadow-color);
  --shadow-glow: 0 0 0 1px var(--accent-soft), 0 18px 60px -20px color-mix(in oklab, var(--accent) 45%, transparent);
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --transition-fast: 140ms var(--ease-out);
  --transition-base: 260ms var(--ease-out);
  --transition-slow: 480ms var(--ease-out);
  --motion: ${theme.motion};
}

[data-theme='light'] {
  color-scheme: light;
${paletteBlock('light')}
  --shadow-glow: 0 0 0 1px var(--accent-soft), 0 18px 60px -24px color-mix(in oklab, var(--accent) 35%, transparent);
}

/* Motion level from theme.yaml — "none" is an accessibility floor, not a taste */
:root[data-motion='none'] *,
:root[data-motion='none'] *::before,
:root[data-motion='none'] *::after {
  animation-duration: 0.001ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.001ms !important;
  scroll-behavior: auto !important;
}

${theme.motion === 'none' ? ':root { --motion: none; }\n' : ''}/* Keep the gutter fluid without a media query pile */
@media (max-width: 640px) {
  :root { --gutter: ${space(4)}; }
}
@media (min-width: 1024px) {
  :root { --gutter: ${space(6)}; }
}
`;

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, css, 'utf8');
console.log(`✓ tokens.css written from theme.yaml (${theme.name}, ${theme.motion} motion)`);
