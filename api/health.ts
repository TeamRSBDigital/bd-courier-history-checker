import { json, safePublicError } from '../src/server/http.ts';

export function GET(): Response {
  return json({ status: 'ok', service: 'bd-courier-history-checker', time: new Date().toISOString() });
}
export default {
  fetch(request: Request): Response {
    if (request.method !== 'GET') return safePublicError(405, 'METHOD_NOT_ALLOWED', 'Use GET for health checks.');
    return GET();
  },
};
