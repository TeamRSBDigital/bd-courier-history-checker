import test from 'node:test';
import assert from 'node:assert/strict';
import { maskPhone, normalizeBangladeshiPhone } from '../src/server/phone.ts';

test('normalizes supported Bangladeshi phone formats', () => {
  assert.equal(normalizeBangladeshiPhone('1712345678'), '01712345678');
  assert.equal(normalizeBangladeshiPhone('01712345678'), '01712345678');
  assert.equal(normalizeBangladeshiPhone('8801712345678'), '01712345678');
  assert.equal(normalizeBangladeshiPhone('+8801712345678'), '01712345678');
  assert.equal(normalizeBangladeshiPhone('+880 1712-345678'), '01712345678');
});

test('rejects malformed phone numbers', () => {
  for (const value of ['017123', '02123456789', '<script>alert(1)</script>', '', null, 1712345678]) {
    assert.equal(normalizeBangladeshiPhone(value), null);
  }
});

test('masks valid numbers', () => {
  assert.equal(maskPhone('01712345678'), '017****5678');
});
