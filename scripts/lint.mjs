import { readdir, readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
const root = new URL('../', import.meta.url);
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (['.git', 'node_modules'].includes(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path)); else files.push(path);
  }
  return files;
}
const files = await walk(root.pathname);
let failed = false;
for (const file of files.filter((f) => ['.js', '.mjs'].includes(extname(f)))) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) failed = true;
}
for (const file of files.filter((f) => ['.js', '.ts', '.html', '.css'].includes(extname(f)))) {
  const text = await readFile(file, 'utf8');
  if (/console\.(log|debug)\s*\(/.test(text) && !file.endsWith('hash-admin-password.mjs')) {
    console.error(`Disallowed console logging: ${file}`); failed = true;
  }
  if (/\bLorem ipsum\b/i.test(text)) { console.error(`Placeholder copy found: ${file}`); failed = true; }
}
if (failed) process.exit(1);
console.log(`Lint checks passed (${files.length} files inspected).`);
