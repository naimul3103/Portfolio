#!/usr/bin/env node
/**
 * check-size.mjs — the JavaScript budget, enforced instead of promised.
 *
 * Budget: 60 KB gzip of first-party JS across the whole static build. The site
 * is expected to use a few KB; the ceiling exists so a future island cannot
 * arrive unnoticed.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const BUDGET_KB = 60;

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) yield* walk(path);
    else yield path;
  }
}

const files = [...walk(dist)];
// Pagefind ships a lazy search bundle that only loads on /search. It is not
// part of the landing-page budget, so it is measured separately.
const scripts = files.filter(
  (file) =>
    extname(file) === '.js' &&
    !file.includes(`${dist}/pagefind/`) &&
    !file.includes(`${dist}/admin/`),
);
const lazy = files.filter((file) => extname(file) === '.js' && file.includes(`${dist}/pagefind/`));
const lazyTotal = lazy.reduce((sum, file) => sum + gzipSync(readFileSync(file)).byteLength, 0);

let total = 0;
const rows = [];
for (const file of scripts) {
  const size = gzipSync(readFileSync(file)).byteLength;
  total += size;
  rows.push({ file: file.replace(`${dist}/`, ''), size });
}

rows.sort((a, b) => b.size - a.size);
const kb = (bytes) => (bytes / 1024).toFixed(1);

console.log('\nFirst-party JavaScript budget\n');
for (const row of rows.slice(0, 12)) {
  console.log(`  ${kb(row.size).padStart(7)} KB gz  ${row.file}`);
}
if (rows.length > 12) console.log(`  … ${rows.length - 12} more files`);

const totalKb = total / 1024;
console.log(
  `\n  ${totalKb.toFixed(1)} KB gzip total · budget ${BUDGET_KB} KB · ${scripts.length} files`,
);
console.log(`  ${(lazyTotal / 1024).toFixed(1)} KB gzip lazy (search bundle, /search only)\n`);

if (totalKb > BUDGET_KB) {
  console.error(`✖ JavaScript budget exceeded by ${(totalKb - BUDGET_KB).toFixed(1)} KB.`);
  console.error('  Remove an island, or lazy-load it behind an interaction.\n');
  process.exit(1);
}

console.log('✓ within budget\n');
