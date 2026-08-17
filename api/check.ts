import { executeCourierCheck } from '../src/server/aggregator.ts';
import { clientIdentifier, json, readJsonBody, requestOriginAllowed, safePublicError } from '../src/server/http.ts';
import { maskPhone, normalizeBangladeshiPhone } from '../src/server/phone.ts';
import { rateLimit } from '../src/server/rate-limit.ts';
import { recordCheckMetrics } from '../src/server/metrics.ts';

export async function POST(request: Request): Promise<Response> {
  if (!requestOriginAllowed(request)) return safePublicError(403, 'ORIGIN_NOT_ALLOWED', 'Request origin is not allowed.');

  let rate;
  try {
    rate = await rateLimit('check', clientIdentifier(request));
  } catch {
    return safePublicError(503, 'SERVICE_CONFIGURATION_ERROR', 'The checking service is temporarily unavailable.');
  }
  if (!rate.allowed) {
    return safePublicError(429, 'RATE_LIMITED', 'Too many requests. Please try again shortly.', { 'retry-after': String(rate.retryAfter) });
  }

  let body: unknown;
  try {
    body = await readJsonBody(request, 2048);
  } catch (error) {
    const code = error instanceof Error ? error.message : 'INVALID_REQUEST';
    if (code === 'UNSUPPORTED_CONTENT_TYPE') return safePublicError(415, code, 'Content-Type must be application/json.');
    if (code === 'BODY_TOO_LARGE') return safePublicError(413, code, 'Request body is too large.');
    return safePublicError(400, 'INVALID_JSON', 'Request body must be valid JSON.');
  }

  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return safePublicError(400, 'INVALID_REQUEST', 'Request body must contain only a phone field.');
  }
  const record = body as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.length !== 1 || keys[0] !== 'phone') {
    return safePublicError(400, 'INVALID_REQUEST', 'Request body must contain only a phone field.');
  }
  const phone = normalizeBangladeshiPhone(record.phone);
  if (!phone) return safePublicError(400, 'INVALID_PHONE', 'Enter a valid Bangladeshi mobile number.');

  const execution = await executeCourierCheck(phone, maskPhone(phone));
  const result = execution.response;
  const ok = result.couriers.filter((provider) => provider.status === 'ok').length;
  const unavailable = result.couriers.filter((provider) => !provider.available).length;
  const outcome = ok > 0 ? (unavailable > 0 ? 'partial' : 'success') : (unavailable === result.couriers.length ? 'failed' : 'no_data');
  await recordCheckMetrics(outcome, result.couriers, execution.latencies);

  return json(result, 200, { 'x-ratelimit-remaining': String(rate.remaining) });
}

export function GET(): Response {
  return safePublicError(405, 'METHOD_NOT_ALLOWED', 'Use POST for courier checks.');
}
export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method === 'POST') return POST(request);
    if (request.method === 'GET') return GET();
    return safePublicError(405, 'METHOD_NOT_ALLOWED', 'Use POST for courier checks.');
  },
};
