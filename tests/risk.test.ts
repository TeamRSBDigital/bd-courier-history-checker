import test from 'node:test';
import assert from 'node:assert/strict';
import { aggregateHistory, calculateRisk, percent } from '../src/server/risk.ts';
import type { CourierHistory } from '../src/server/types.ts';

test('calculates percentages safely', () => {
  assert.equal(percent(8, 10), 80);
  assert.equal(percent(1, 3), 33.33);
  assert.equal(percent(0, 0), null);
});

test('risk is transparent and insufficient for too little data', () => {
  assert.equal(calculateRisk(null, 0, 0), 'INSUFFICIENT_DATA');
  assert.equal(calculateRisk(95, 2, 1), 'INSUFFICIENT_DATA');
  assert.equal(calculateRisk(55, 10, 1), 'HIGH');
  assert.equal(calculateRisk(70, 10, 1), 'MODERATE');
  assert.equal(calculateRisk(90, 10, 1), 'LOW');
});

test('aggregates only compatible successful provider data', () => {
  const rows: CourierHistory[] = [
    { courier: 'steadfast', available: true, status: 'ok', total: 10, delivered: 8, returned: 1, cancelled: 1, success_rate: 80 },
    { courier: 'pathao', available: false, status: 'timeout', total: 0, delivered: 0, returned: 0, cancelled: 0, success_rate: null },
    { courier: 'redx', available: true, status: 'ok', total: 5, delivered: 5, returned: 0, cancelled: 0, success_rate: 100 },
  ];
  const result = aggregateHistory(rows);
  assert.equal(result.total_orders, 15);
  assert.equal(result.delivered, 13);
  assert.equal(result.couriers_reporting, 2);
  assert.equal(result.success_rate, 86.67);
});
