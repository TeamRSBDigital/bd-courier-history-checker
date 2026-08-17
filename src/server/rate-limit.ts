import { env, isProduction } from './env.ts';
import { hmacHex } from './crypto.ts';
import { redisConfigured, redisPipeline, redisTransaction } from './upstash.ts';

interface RateLimitResult { allowed: boolean; remaining: number; retryAfter: number; backend: 'upstash' | 'local' }
const localBuckets = new Map<string, { count: number; reset: number }>();

async function identifierHash(scope: string, identifier: string): Promise<string> {
  if (isProduction() && env.phoneHmacSecret.length < 32) throw new Error('PHONE_HMAC_SECRET_REQUIRED');
  const secret = env.phoneHmacSecret || env.adminSessionSecret || 'development-only-rate-limit-key';
  return hmacHex(secret, `${scope}:${identifier}`);
}

export async function rateLimit(scope: string, identifier: string, limit = env.rateLimitRequests, windowSeconds = env.rateLimitWindowSeconds): Promise<RateLimitResult> {
  const keyHash = await identifierHash(scope, identifier);
  if (redisConfigured()) {
    const key = `rl:${scope}:${keyHash.slice(0, 32)}`;
    const result = await redisTransaction([
      ['INCR', key],
      ['EXPIRE', key, String(windowSeconds), 'NX'],
      ['TTL', key],
      ['HINCRBY', 'metrics:rate_limit', `${scope}:attempts`, '1'],
    ]);
    const count = Number(result[0]?.result ?? Number.NaN);
    const ttl = Math.max(1, Number(result[2]?.result ?? windowSeconds));
    if (!Number.isFinite(count)) throw new Error('RATE_LIMIT_BACKEND_INVALID');
    const allowed = count <= limit;
    if (!allowed) {
      try { await redisPipeline([['HINCRBY', 'metrics:rate_limit', `${scope}:blocked`, '1']]); } catch { /* limiter decision is already complete */ }
    }
    return { allowed, remaining: Math.max(0, limit - count), retryAfter: ttl, backend: 'upstash' };
  }

  if (isProduction()) throw new Error('RATE_LIMIT_BACKEND_REQUIRED');
  const now = Date.now();
  const existing = localBuckets.get(keyHash);
  const bucket = !existing || existing.reset <= now ? { count: 0, reset: now + windowSeconds * 1000 } : existing;
  bucket.count += 1;
  localBuckets.set(keyHash, bucket);
  return {
    allowed: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    retryAfter: Math.max(1, Math.ceil((bucket.reset - now) / 1000)),
    backend: 'local',
  };
}
