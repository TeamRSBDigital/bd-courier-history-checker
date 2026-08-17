import { randomBytes, webcrypto } from 'node:crypto';
const password = process.argv[2];
if (!password || password.length < 12) {
  console.error('Usage: node scripts/hash-admin-password.mjs "a-password-of-at-least-12-characters"');
  process.exit(1);
}
const salt = randomBytes(24).toString('hex');
const encoder = new TextEncoder();
const material = await webcrypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
const bits = await webcrypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: encoder.encode(salt), iterations: 210000 }, material, 256);
const hash = Buffer.from(bits).toString('hex');
console.log(`ADMIN_PASSWORD_SALT=${salt}`);
console.log(`ADMIN_PASSWORD_HASH=${hash}`);
