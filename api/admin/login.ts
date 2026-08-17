import { createSessionCookie, verifyAdminCredentials } from '../../src/server/auth.ts';
import { clientIdentifier, json, readJsonBody, requestOriginAllowed, safePublicError } from '../../src/server/http.ts';
import { rateLimit } from '../../src/server/rate-limit.ts';

export async function POST(request: Request): Promise<Response> {
  if (!requestOriginAllowed(request)) return safePublicError(403, 'ORIGIN_NOT_ALLOWED', 'Request origin is not allowed.');
  let rate;
  try { rate = await rateLimit('admin-login', clientIdentifier(request), 5, 600); }
  catch { return safePublicError(503, 'ADMIN_UNAVAILABLE', 'Admin authentication is temporarily unavailable.'); }
  if (!rate.allowed) return safePublicError(429, 'RATE_LIMITED', 'Too many login attempts. Try again later.', { 'retry-after': String(rate.retryAfter) });

  let body: unknown;
  try { body = await readJsonBody(request, 2048); }
  catch { return safePublicError(400, 'INVALID_REQUEST', 'Invalid login request.'); }
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return safePublicError(400, 'INVALID_REQUEST', 'Invalid login request.');
  const record = body as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  if (keys.length !== 2 || keys[0] !== 'password' || keys[1] !== 'username') return safePublicError(400, 'INVALID_REQUEST', 'Invalid login request.');
  const valid = await verifyAdminCredentials(record.username, record.password);
  if (!valid) return safePublicError(401, 'INVALID_CREDENTIALS', 'Invalid username or password.');
  return json({ ok: true }, 200, { 'set-cookie': await createSessionCookie() });
}
export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') return safePublicError(405, 'METHOD_NOT_ALLOWED', 'Use POST for sign in.');
    return POST(request);
  },
};
