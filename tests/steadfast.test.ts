import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSteadfastPayload } from '../src/server/providers/steadfast.ts';

test('Steadfast parser normalizes an authorized API-shaped payload', () => {
  const result = parseSteadfastPayload({ data: { Total_parcels: 12, total_delivered: 9, total_cancelled: 2, total_returned: 1 } });
  assert.ok(result);
  assert.equal(result.total, 12);
  assert.equal(result.delivered, 9);
  assert.equal(result.returned, 1);
  assert.equal(result.cancelled, 2);
  assert.equal(result.success_rate, 75);
});

test('Steadfast parser rejects malformed or internally inconsistent responses', () => {
  assert.equal(parseSteadfastPayload({ data: { Total_parcels: 2, total_delivered: 3, total_cancelled: 0 } }), null);
  assert.equal(parseSteadfastPayload({ data: { Total_parcels: 'not-a-count', total_delivered: 0, total_cancelled: 0 } }), null);
});
