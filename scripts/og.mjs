#!/usr/bin/env node
/**
 * og.mjs — generates the Open Graph card from the same theme tokens as the site.
 *
 * One card is enough at this size: every page shares the identity block, and a
 * single committed PNG avoids a font dependency in CI. Regenerate with
 * `npm run og` after changing content/theme.yaml.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { parse } from 'yaml';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const theme = parse(readFileSync(join(root, 'content/theme.yaml'), 'utf8'));
const site = parse(readFileSync(join(root, 'content/site-config.yaml'), 'utf8'));
const { dark } = theme;

const W = 1200;
const H = 630;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${dark.accent_gradient[0]}"/>
      <stop offset="1" stop-color="${dark.accent_gradient[1]}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.12" cy="0.05" r="0.9">
      <stop offset="0" stop-color="${dark.accent_gradient[0]}" stop-opacity="0.28"/>
      <stop offset="0.6" stop-color="${dark.accent_gradient[0]}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow2" cx="0.95" cy="0.1" r="0.7">
      <stop offset="0" stop-color="${dark.accent_gradient[1]}" stop-opacity="0.18"/>
      <stop offset="0.7" stop-color="${dark.accent_gradient[1]}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M48 0H0V48" fill="none" stroke="${dark.text}" stroke-opacity="0.05" stroke-width="1"/>
    </pattern>
  </defs>

  <rect width="${W}" height="${H}" fill="${dark.background}"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect width="${W}" height="${H}" fill="url(#glow2)"/>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>
  <rect x="0" y="0" width="${W}" height="4" fill="url(#accent)"/>

  <g font-family="Helvetica Neue, Helvetica, Arial, sans-serif">
    <text x="80" y="150" font-size="22" letter-spacing="6" fill="${dark.muted}" font-family="Menlo, monospace">AI/ML ENGINEER · BANGLADESH</text>
    <text x="80" y="270" font-size="76" font-weight="700" fill="${dark.text}" letter-spacing="-2">Md Naimul Islam</text>
    <text x="80" y="340" font-size="34" fill="${dark.muted}">I build models, then the APIs that make them useful.</text>
  </g>

  <g font-family="Menlo, monospace" font-size="20" fill="${dark.muted}">
    <text x="80" y="470">python · fastapi · scikit-learn · pandas</text>
    <text x="80" y="540" fill="${dark.text}">naimul3103.pages.dev</text>
  </g>

  <g transform="translate(956 452)">
    <rect width="164" height="56" rx="10" fill="none" stroke="url(#accent)" stroke-opacity="0.65"/>
    <text x="82" y="36" text-anchor="middle" font-family="Menlo, monospace" font-size="19" fill="${dark.text}">portfolio</text>
  </g>

  <text x="80" y="590" font-size="16" font-family="Menlo, monospace" fill="${dark.muted}" opacity="0.65">${site.role_line}</text>
</svg>`;

const out = join(root, 'public/og/default.png');
mkdirSync(dirname(out), { recursive: true });
await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(out);
writeFileSync(join(root, 'public/og/default.svg'), svg, 'utf8');

// Apple touch icon: 180×180, opaque (iOS does not honour transparency well here).
const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${dark.accent_gradient[0]}"/>
      <stop offset="1" stop-color="${dark.accent_gradient[1]}"/>
    </linearGradient>
  </defs>
  <rect width="180" height="180" fill="${dark.background}"/>
  <text x="90" y="112" text-anchor="middle" font-family="Menlo, monospace" font-size="64" font-weight="700" fill="url(#g)">NI</text>
</svg>`;
await sharp(Buffer.from(icon))
  .png({ compressionLevel: 9 })
  .toFile(join(root, 'public/apple-touch-icon.png'));

console.log('✓ public/og/default.png (1200×630) regenerated from theme.yaml');
console.log('✓ public/apple-touch-icon.png (180×180)');
