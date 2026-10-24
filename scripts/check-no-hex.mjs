#!/usr/bin/env node
/**
 * check-no-hex.mjs — mechanical enforcement of the "nothing hard-coded" rule.
 *
 * Colours belong to content/theme.yaml, never to components. This gate keeps
 * retheming a one-file operation by failing CI on any raw hex / rgb() / hsl()
 * in src/ outside the generated token file.
 *
 * Allowlist (deliberate, small): src/styles/tokens.css (generated) and files
 * listed in scripts/hex-allowlist.json (e.g. an inline SVG that must embed a
 * brand mark).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src');

const alwaysAllow = new Set(['src/styles/tokens.css']);
let allow = new Set();
try {
  const list = JSON.parse(readFileSync(join(root, 'scripts/hex-allowlist.json'), 'utf8'));
  allow = new Set(list.allow ?? []);
} catch {
  /* optional file */
}

const codeExtensions = new Set(['.astro', '.css', '.ts', '.tsx', '.js', '.mjs', '.html']);
const patterns = [
  { re: /#[0-9a-fA-F]{6}\b/g, label: 'hex colour' },
  { re: /#[0-9a-fA-F]{3}\b(?![0-9a-zA-Z])/g, label: 'short hex colour' },
  { re: /\brgba?\(/g, label: 'rgb()/rgba()' },
  { re: /\bhsla?\(/g, label: 'hsl()/hsla()' },
];

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) yield* walk(path);
    else yield path;
  }
}

const violations = [];
for (const file of walk(src)) {
  if (!codeExtensions.has(extname(file))) continue;
  const rel = relative(root, file).split('\\').join('/');
  if (alwaysAllow.has(rel) || allow.has(rel)) continue;

  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, index) => {
    for (const { re, label } of patterns) {
      const match = line.match(re);
      if (match) violations.push({ file: rel, line: index + 1, value: match[0], label });
    }
  });
}

if (violations.length > 0) {
  console.error('\n✖ hard-coded colour values found in src/ — move them to content/theme.yaml\n');
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  ${v.label}  ${v.value}`);
  }
  console.error(
    `\n${violations.length} violation(s). Use var(--token-name) or color-mix(in oklab, var(--token) …).\n`,
  );
  process.exit(1);
}

const count = [...walk(src)].filter((f) => codeExtensions.has(extname(f))).length;
console.log(`✓ no hard-coded colours in ${count} source files`);
