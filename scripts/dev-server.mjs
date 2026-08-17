import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const staticRoot = join(root, 'public');

async function loadEnvFile(name) {
  try {
    const text = await readFile(join(root, name), 'utf8');
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq < 1) continue;
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
      if (process.env[key] === undefined) process.env[key] = value;
    }
  } catch { /* optional local env file */ }
}
await loadEnvFile('.env');
await loadEnvFile('.env.local');
process.env.APP_ENV ||= 'development';
process.env.APP_URL ||= 'http://localhost:3000';

const apiMap = new Map([
  ['/api/check', 'api/check.ts'],
  ['/api/health', 'api/health.ts'],
  ['/api/ready', 'api/ready.ts'],
  ['/api/admin/login', 'api/admin/login.ts'],
  ['/api/admin/logout', 'api/admin/logout.ts'],
  ['/api/admin/dashboard', 'api/admin/dashboard.ts'],
]);

const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain; charset=utf-8' };

async function bodyBuffer(req) {
  const parts = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1_000_000) throw new Error('too large');
    parts.push(chunk);
  }
  return Buffer.concat(parts);
}

async function handleApi(req, res, pathname, url) {
  const file = apiMap.get(pathname);
  if (!file) return false;
  const mod = await import(pathToFileURL(join(root, file)).href);
  const method = (req.method || 'GET').toUpperCase();
  const body = ['GET','HEAD'].includes(method) ? undefined : await bodyBuffer(req);
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) if (value !== undefined) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
  const request = new Request(url, { method, headers, body: body && body.length ? body : undefined });
  const webHandler = mod.default && typeof mod.default.fetch === 'function' ? mod.default.fetch.bind(mod.default) : null;
  const methodHandler = typeof mod[method] === 'function' ? mod[method] : null;
  if (!webHandler && !methodHandler) { res.writeHead(405); res.end('Method Not Allowed'); return true; }
  const response = webHandler ? await webHandler(request) : await methodHandler(request);
  const outputHeaders = Object.fromEntries(response.headers.entries());
  res.writeHead(response.status, outputHeaders);
  res.end(Buffer.from(await response.arrayBuffer()));
  return true;
}

async function handleStatic(res, pathname) {
  let relative = decodeURIComponent(pathname);
  if (relative === '/') relative = '/index.html';
  if (relative.endsWith('/')) relative += 'index.html';
  const safe = normalize(relative).replace(/^([.][.][/\\])+/, '').replace(/^[/\\]+/, '');
  let file = join(staticRoot, safe);
  if (!file.startsWith(staticRoot)) { res.writeHead(403); res.end('Forbidden'); return; }
  try {
    const info = await stat(file);
    if (info.isDirectory()) file = join(file, 'index.html');
    const data = await readFile(file);
    res.writeHead(200, { 'content-type': mime[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(data);
  } catch {
    const data = await readFile(join(staticRoot, '404.html'));
    res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' }); res.end(data);
  }
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', 'http://localhost:3000');
    if (await handleApi(req, res, url.pathname, url)) return;
    await handleStatic(res, url.pathname);
  } catch {
    res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' }); res.end('Internal Server Error');
  }
}).listen(3000, '127.0.0.1', () => {
  process.stdout.write('CourierCheck BD local server: http://localhost:3000\n');
});
