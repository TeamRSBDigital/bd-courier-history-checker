import { access, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('../', import.meta.url).pathname;

// Only deployment-critical files belong in the production build check.
// Repository documentation/dotfiles are verified separately by repo-check.mjs
// so Vercel builds never depend on non-runtime delivery artifacts.
const required = [
  'public/index.html',
  'public/styles.css',
  'public/app.js',
  'public/admin/index.html',
  'public/admin/admin.js',
  'api/check.ts',
  'api/health.ts',
  'api/ready.ts',
  'package-lock.json',
  'vercel.json',
  'tsconfig.json',
];

for (const file of required) await access(join(root, file));

const rootEntries = await readdir(root);
for (const name of rootEntries) {
  if (/\.(bak|tmp|log)$/i.test(name)) {
    throw new Error(`Temporary file in repository root: ${name}`);
  }
}

console.log('Production deployment build checks passed.');
