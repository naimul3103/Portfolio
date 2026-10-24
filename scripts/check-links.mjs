#!/usr/bin/env node
/**
 * check-links.mjs — internal link integrity against the built site.
 *
 * Runs on dist/, so it catches the links that actually ship: nav, footer,
 * content body links, evidence links into the site, and anchors.
 *
 * External URLs are reported but never fetched (CI should not depend on the
 * availability of someone else's server). A weekly job can do that separately.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) yield* walk(path);
    else yield path;
  }
}

const pages = [...walk(dist)].filter((file) => extname(file) === '.html');
const hrefPattern = /href="([^"]+)"/g;
const idsCache = new Map();

function idsFor(file) {
  if (idsCache.has(file)) return idsCache.get(file);
  const html = readFileSync(file, 'utf8');
  const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map((match) => match[1]));
  idsCache.set(file, ids);
  return ids;
}

/** Map a site path to the HTML file Pages will serve. */
function resolve(pathname) {
  const clean = pathname.replace(/\/+$/, '');
  const candidates = [
    join(dist, clean, 'index.html'),
    join(dist, `${clean}.html`),
    join(dist, clean),
  ];
  return candidates.find((candidate) => existsSync(candidate) && statSync(candidate).isFile());
}

const broken = [];
const external = new Set();

for (const page of pages) {
  const html = readFileSync(page, 'utf8');
  const pageUrl = `/${relative(dist, page).replace(/index\.html$/, '')}`;
  for (const match of html.matchAll(hrefPattern)) {
    const href = match[1];
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:'))
      continue;
    if (/^https?:\/\//.test(href)) {
      external.add(href.split('#')[0]);
      continue;
    }
    if (href.startsWith('data:')) continue;

    const [pathPart, hash] = href.split('#');
    const target = pathPart === '' ? page : resolve(pathPart);
    if (!target) {
      broken.push({ page: pageUrl, href });
      continue;
    }
    if (hash && !idsFor(target).has(hash)) {
      broken.push({ page: pageUrl, href, reason: `missing #${hash}` });
    }
  }
}

console.log(
  `\nChecked ${pages.length} pages · ${external.size} unique external URLs (not fetched)\n`,
);

if (broken.length) {
  for (const item of broken) {
    console.error(`  ✖ ${item.page} → ${item.href}${item.reason ? ` (${item.reason})` : ''}`);
  }
  console.error(`\n✖ ${broken.length} broken internal link(s)\n`);
  process.exit(1);
}

console.log('✓ no broken internal links\n');
