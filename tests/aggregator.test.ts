import test from 'node:test';
import assert from 'node:assert/strict';
import { checkAllCouriers } from '../src/server/aggregator.ts';
import type { CourierProvider } from '../src/server/types.ts';

const okProvider: CourierProvider = {
  name: 'steadfast',
  configurationStatus: () => ({ courier: 'steadfast', state: 'configured', detail: 'test' }),
  check: async () => ({ courier: 'steadfast', available: true, status: 'ok', total: 4, delivered: 3, returned: 1, cancelled: 0, success_rate: 75 }),
};
const failedProvider: CourierProvider = {
  name: 'pathao',
  configurationStatus: () => ({ courier: 'pathao', state: 'external_blocker', detail: 'test' }),
  check: async () => { throw new Error('simulated upstream failure'); },
};

test('one provider failure does not discard successful results', async () => {
  const result = await checkAllCouriers('01712345678', '017****5678', [okProvider, failedProvider]);
  assert.equal(result.summary.total_orders, 4);
  assert.equal(result.couriers[0].status, 'ok');
  assert.equal(result.couriers[1].status, 'unavailable');
});

test('explicit development mock mode yields deterministic provider results', async () => {
  const result = await checkAllCouriers('01712345678', '017****5678');
  assert.equal(result.couriers.length, 4);
  assert.ok(result.couriers.every((item) => item.status === 'ok' || item.status === 'no_data'));
});
