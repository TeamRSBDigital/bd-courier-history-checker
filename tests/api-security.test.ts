import test from 'node:test';
import assert from 'node:assert/strict';
import { POST as checkPost, GET as checkGet } from '../api/check.ts';
import { GET as adminDashboard } from '../api/admin/dashboard.ts';
import { POST as adminLogin } from '../api/admin/login.ts';
import { POST as adminLogout } from '../api/admin/logout.ts';
import { rateLimit } from '../src/server/rate-limit.ts';

function request(body: string, contentType = 'application/json', extra: Record<string,string> = {}) {
  return new Request('http://localhost:3000/api/check', { method: 'POST', headers: { 'content-type': contentType, origin: 'http://localhost:3000', 'x-forwarded-for': `127.0.0.${Math.floor(Math.random()*200)+1}`, ...extra }, body });
}

test('check endpoint rejects wrong content type', async () => {
  const response = await checkPost(request('{}', 'text/plain'));
  assert.equal(response.status, 415);
});

test('check endpoint rejects malformed and injection-style phone payloads', async () => {
  const response = await checkPost(request(JSON.stringify({ phone: '<script>alert(1)</script>' })));
  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.equal(payload.error.code, 'INVALID_PHONE');
});

test('check endpoint rejects oversized body', async () => {
  const response = await checkPost(request(JSON.stringify({ phone: '01712345678', padding: 'x'.repeat(3000) })));
  assert.equal(response.status, 413);
});

test('check endpoint accepts valid request in explicit test mock mode', async () => {
  const response = await checkPost(request(JSON.stringify({ phone: '+8801712345678' })));
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.phone_masked, '017****5678');
  assert.equal(payload.couriers.length, 4);
});


test('check endpoint rejects unknown request fields', async () => {
  const response = await checkPost(request(JSON.stringify({ phone: '01712345678', debug: true })));
  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.equal(payload.error.code, 'INVALID_REQUEST');
});

test('public response does not expose rate-limit backend details', async () => {
  const response = await checkPost(request(JSON.stringify({ phone: '01712345678' })));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-ratelimit-backend'), null);
});

test('GET on sensitive check endpoint is not allowed', () => {
  assert.equal(checkGet().status, 405);
});

test('admin dashboard requires authentication', async () => {
  const response = await adminDashboard(new Request('http://localhost:3000/api/admin/dashboard'));
  assert.equal(response.status, 401);
});


test('admin authentication creates a signed session and authorizes the dashboard', async () => {
  const login = await adminLogin(new Request('http://localhost:3000/api/admin/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://localhost:3000', 'x-forwarded-for': `127.0.1.${Math.floor(Math.random()*200)+1}` },
    body: JSON.stringify({ username: 'admin-test', password: 'correct horse battery staple' }),
  }));
  assert.equal(login.status, 200);
  const setCookie = login.headers.get('set-cookie');
  assert.ok(setCookie);
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /SameSite=Strict/i);
  const cookie = setCookie.split(';')[0];
  const dashboard = await adminDashboard(new Request('http://localhost:3000/api/admin/dashboard', { headers: { cookie } }));
  assert.equal(dashboard.status, 200);
  const payload = await dashboard.json();
  assert.equal(payload.application.admin_auth, 'configured');
  const logout = adminLogout(new Request('http://localhost:3000/api/admin/logout', { method: 'POST', headers: { origin: 'http://localhost:3000', cookie } }));
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get('set-cookie') || '', /Max-Age=0/i);
});

test('admin authentication rejects an incorrect password', async () => {
  const response = await adminLogin(new Request('http://localhost:3000/api/admin/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://localhost:3000', 'x-forwarded-for': `127.0.2.${Math.floor(Math.random()*200)+1}` },
    body: JSON.stringify({ username: 'admin-test', password: 'incorrect' }),
  }));
  assert.equal(response.status, 401);
});

test('local development limiter enforces requested ceiling', async () => {
  const id = `test-${Date.now()}-${Math.random()}`;
  assert.equal((await rateLimit('unit', id, 2, 60)).allowed, true);
  assert.equal((await rateLimit('unit', id, 2, 60)).allowed, true);
  assert.equal((await rateLimit('unit', id, 2, 60)).allowed, false);
});
