import test from 'node:test';
import assert from 'node:assert/strict';
import checkHandler from '../api/check.ts';
import healthHandler from '../api/health.ts';
import readyHandler from '../api/ready.ts';
import loginHandler from '../api/admin/login.ts';
import logoutHandler from '../api/admin/logout.ts';
import dashboardHandler from '../api/admin/dashboard.ts';

test('all Vercel API modules expose Web Handler fetch entrypoints', () => {
  for (const handler of [checkHandler, healthHandler, readyHandler, loginHandler, logoutHandler, dashboardHandler]) {
    assert.equal(typeof handler.fetch, 'function');
  }
});

test('Vercel Web Handler dispatches health and method restrictions', async () => {
  const health = await healthHandler.fetch(new Request('http://localhost:3000/api/health'));
  assert.equal(health.status, 200);
  const denied = await checkHandler.fetch(new Request('http://localhost:3000/api/check', { method: 'PUT' }));
  assert.equal(denied.status, 405);
});
