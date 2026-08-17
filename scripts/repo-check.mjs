import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('../', import.meta.url).pathname;
const required = [
  '.env.example',
  '.gitignore',
  '.vercelignore',
  '.github/workflows/ci.yml',
  'README.md',
  'SECURITY.md',
  'TODO.md',
  'FINAL_REPORT.md',
];

for (const file of required) await access(join(root, file));

const envExample = await readFile(join(root, '.env.example'), 'utf8');
for (const variable of [
  'UPSTASH_REDIS_REST_URL=',
  'UPSTASH_REDIS_REST_TOKEN=',
  'PHONE_HMAC_SECRET=',
  'STEADFAST_API_KEY=',
]) {
  if (!envExample.includes(variable)) {
    throw new Error(`.env.example is missing ${variable}`);
  }
}

const gitignore = await readFile(join(root, '.gitignore'), 'utf8');
if (!gitignore.includes('!.env.example')) {
  throw new Error('.env.example must remain committable');
}

const vercelIgnore = await readFile(join(root, '.vercelignore'), 'utf8');
for (const requiredDuringBuild of ['scripts/', 'tsconfig.json']) {
  if (vercelIgnore.split(/\r?\n/).some((line) => line.trim() === requiredDuringBuild)) {
    throw new Error(`.vercelignore must not exclude build dependency: ${requiredDuringBuild}`);
  }
}

console.log('Repository delivery checks passed.');
