import { clearSessionCookie } from '../../src/server/auth.ts';
import { json, requestOriginAllowed, safePublicError } from '../../src/server/http.ts';

export function POST(request: Request): Response {
  if (!requestOriginAllowed(request)) return safePublicError(403, 'ORIGIN_NOT_ALLOWED', 'Request origin is not allowed.');
  return json({ ok: true }, 200, { 'set-cookie': clearSessionCookie() });
}
export default {
  fetch(request: Request): Response {
    if (request.method !== 'POST') return safePublicError(405, 'METHOD_NOT_ALLOWED', 'Use POST for sign out.');
    return POST(request);
  },
};
