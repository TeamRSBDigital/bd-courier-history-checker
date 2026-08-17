import { adminConfigured } from '../src/server/auth.ts';
import { env, isProduction } from '../src/server/env.ts';
import { json, safePublicError } from '../src/server/http.ts';
import { redisConfigured } from '../src/server/upstash.ts';

function productionAppUrlReady(): boolean {
  if (!isProduction()) return true;
  try {
    const url = new URL(env.appUrl);
    return url.protocol === 'https:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1';
  } catch { return false; }
}

export function GET(): Response {
  const checks = {
    app_url: productionAppUrlReady(),
    rate_limit_store: redisConfigured() || !isProduction(),
    phone_hmac_secret: env.phoneHmacSecret.length >= 32 || !isProduction(),
    admin_auth: adminConfigured() || !isProduction(),
  };
  const ready = Object.values(checks).every(Boolean);
  return json({ status: ready ? 'ready' : 'not_ready' }, ready ? 200 : 503);
}
export default {
  fetch(request: Request): Response {
    if (request.method !== 'GET') return safePublicError(405, 'METHOD_NOT_ALLOWED', 'Use GET for readiness checks.');
    return GET();
  },
};
