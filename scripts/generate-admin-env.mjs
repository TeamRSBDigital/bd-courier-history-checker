import { randomBytes, webcrypto } from 'node:crypto';

const username = process.argv[2] || 'admin';
const suppliedPassword = process.argv[3];
const appUrl = process.argv[4] || 'https://courier-history-checker-three.vercel.app';
const password = suppliedPassword || randomBytes(18).toString('base64url');

if (!/^[A-Za-z0-9._-]{3,64}$/.test(username)) {
  console.error('Username must be 3-64 characters and contain only letters, numbers, dot, underscore, or hyphen.');
  process.exit(1);
}
if (password.length < 12 || password.length > 256) {
  console.error('Password must be between 12 and 256 characters.');
  process.exit(1);
}

try {
  const parsed = new URL(appUrl);
  if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost') throw new Error('invalid');
} catch {
  console.error('APP_URL must be a valid HTTPS URL (or localhost for development).');
  process.exit(1);
}

const salt = randomBytes(24).toString('hex');
const sessionSecret = randomBytes(48).toString('hex');
const phoneHmacSecret = randomBytes(48).toString('hex');
const encoder = new TextEncoder();
const material = await webcrypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
const bits = await webcrypto.subtle.deriveBits(
  { name: 'PBKDF2', hash: 'SHA-256', salt: encoder.encode(salt), iterations: 210000 },
  material,
  256,
);
const hash = Buffer.from(bits).toString('hex');

console.log('# PRIVATE — DO NOT COMMIT THIS OUTPUT TO GITHUB');
console.log(`# Admin login username: ${username}`);
console.log(`# Admin login password: ${password}`);
console.log('');
console.log(`APP_URL=${appUrl.replace(/\/$/, '')}`);
console.log('APP_ENV=production');
console.log(`PHONE_HMAC_SECRET=${phoneHmacSecret}`);
console.log(`ADMIN_USERNAME=${username}`);
console.log(`ADMIN_PASSWORD_SALT=${salt}`);
console.log(`ADMIN_PASSWORD_HASH=${hash}`);
console.log(`ADMIN_SESSION_SECRET=${sessionSecret}`);
console.log('ADMIN_SESSION_TTL_SECONDS=28800');
console.log('RATE_LIMIT_REQUESTS=20');
console.log('RATE_LIMIT_WINDOW_SECONDS=60');
console.log('UPSTASH_REDIS_REST_URL=');
console.log('UPSTASH_REDIS_REST_TOKEN=');
console.log('MOCK_COURIERS=false');
console.log('');
console.log('# Fill the two UPSTASH values in Vercel before production admin login can work.');
