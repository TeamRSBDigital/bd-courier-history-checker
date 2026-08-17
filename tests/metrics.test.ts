import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRedisHash } from '../src/server/metrics.ts';

test('normalizes raw Upstash REST HGETALL flat arrays', () => {
  assert.deepEqual(normalizeRedisHash(['total', '7', 'partial', 2]), { total: '7', partial: '2' });
  assert.deepEqual(normalizeRedisHash({ total: '3' }), { total: '3' });
  assert.deepEqual(normalizeRedisHash(null), {});
});
