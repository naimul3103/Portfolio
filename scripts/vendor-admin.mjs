#!/usr/bin/env node
/**
 * vendor-admin.mjs — re-download the pinned Sveltia CMS bundle.
 *
 * The CMS is served from our own origin on purpose: the /admin CSP can then stay
 * `script-src 'self'`, and a supply-chain change in a CDN cannot silently reach
 * a page that has repository write access.
 *
 * Usage: npm run vendor:admin
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const VERSION = '0.251.0';
const SOURCE = `https://unpkg.com/@sveltia/cms@${VERSION}/dist/sveltia-cms.js`;

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const target = join(root, 'public/admin/sveltia-cms.js');

const response = await fetch(SOURCE);
if (!response.ok) {
  console.error(`✖ ${response.status} from ${SOURCE}`);
  process.exit(1);
}

const body = await response.text();
if (!body.startsWith('(function') && !body.startsWith('!function')) {
  console.error('✖ unexpected bundle shape — refusing to write');
  process.exit(1);
}

writeFileSync(target, body, 'utf8');
console.log(
  `✓ Sveltia CMS ${VERSION} → public/admin/sveltia-cms.js (${(body.length / 1024 / 1024).toFixed(1)} MB)`,
);
console.log('  Update the version constant in this script when upgrading, and commit the diff.');
