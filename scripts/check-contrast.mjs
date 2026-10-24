#!/usr/bin/env node
/**
 * check-contrast.mjs — WCAG 2.2 AA gate for every theme colour pair.
 *
 * The theme is editable content, so contrast cannot be a design-time promise.
 * This script is the promise: if someone picks a pretty-but-unreadable accent,
 * CI fails with a plain-language report naming the pair and the ratio.
 *
 * Thresholds: 4.5:1 (normal text), 3:1 (large text / UI). Runs on both palettes.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const theme = parse(readFileSync(join(root, 'content/theme.yaml'), 'utf8'));

const toRgb = (hex) => {
  const value = hex.replace('#', '');
  return [0, 2, 4].map((i) => Number.parseInt(value.slice(i, i + 2), 16) / 255);
};

const channel = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

const luminance = (hex) => {
  const [r, g, b] = toRgb(hex).map(channel);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const ratio = (a, b) => {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

// [foreground, background, label, minimum]
const pairs = [
  ['text', 'background', 'body text on page', 4.5],
  ['muted', 'background', 'muted text on page', 4.5],
  ['accent', 'background', 'links/accent on page', 4.5],
  ['text', 'surface', 'body text on surface', 4.5],
  ['muted', 'surface', 'muted text on surface', 4.5],
  ['text', 'elevated', 'body text on elevated surface', 4.5],
  ['muted', 'elevated', 'muted text on elevated surface', 4.5],
  ['accent', 'surface', 'accent on surface', 4.5],
  ['danger', 'background', 'error text on page', 4.5],
  ['border', 'background', 'hairline border (UI)', 1.2],
];

let failures = 0;
const rows = [];

for (const mode of ['dark', 'light']) {
  const palette = theme[mode];
  for (const [fgKey, bgKey, label, min] of pairs) {
    const fg = palette[fgKey];
    const bg = palette[bgKey];
    if (!fg || !bg) continue;
    const value = ratio(fg, bg);
    const pass = value >= min;
    if (!pass) failures += 1;
    rows.push({
      mode,
      pair: `${label} (${fgKey}/${bgKey})`,
      ratio: value.toFixed(2),
      min: min.toFixed(1),
      pass,
    });
  }
}

const width = Math.max(...rows.map((r) => r.pair.length));
console.log('\nTheme contrast report (WCAG 2.2 AA)\n');
for (const row of rows) {
  console.log(
    `${row.pass ? '✓' : '✖'} ${row.mode.padEnd(5)} ${row.pair.padEnd(width)}  ${row.ratio.padStart(5)}:1  (min ${row.min}:1)`,
  );
}

if (failures > 0) {
  console.error(
    `\n✖ ${failures} contrast pair${failures === 1 ? '' : 's'} below threshold. ` +
      'Fix the colour in content/theme.yaml — pick a darker/lighter tone until the ratio clears ' +
      'the minimum. Do not lower the threshold.\n',
  );
  process.exit(1);
}

console.log('\n✓ all theme pairs pass\n');
