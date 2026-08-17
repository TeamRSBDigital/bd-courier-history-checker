import { env, isProduction } from './env.ts';

export const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store, max-age=0',
  pragma: 'no-cache',
};

export function json(data: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), { status, headers: { ...JSON_HEADERS, ...extra } });
}

export function safePublicError(status: number, code: string, message: string, extra: Record<string, string> = {}): Response {
  return json({ error: { code, message } }, status, extra);
}

export function requestOriginAllowed(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  const allowed = new Set<string>();
  try { allowed.add(new URL(env.appUrl).origin); } catch { /* invalid config rejected by readiness */ }
  if (env.vercelUrl) allowed.add(`https://${env.vercelUrl}`);
  if (env.appEnv !== 'production') {
    allowed.add('http://localhost:3000');
    allowed.add('http://127.0.0.1:3000');
  }
  return allowed.has(origin);
}

export function clientIdentifier(request: Request): string {
  const vercel = request.headers.get('x-vercel-forwarded-for');
  const forwarded = request.headers.get('x-forwarded-for');
  const raw = isProduction() ? (vercel || 'missing-vercel-client-ip') : (vercel || forwarded || 'unknown');
  return raw.split(',')[0].trim().slice(0, 80) || 'unknown';
}

export async function readJsonBody(request: Request, maxBytes = 2048): Promise<unknown> {
  const type = request.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
  if (type !== 'application/json') throw new Error('UNSUPPORTED_CONTENT_TYPE');
  const declared = Number.parseInt(request.headers.get('content-length') ?? '0', 10);
  if (Number.isFinite(declared) && declared > maxBytes) throw new Error('BODY_TOO_LARGE');

  const reader = request.body?.getReader();
  if (!reader) throw new Error('INVALID_JSON');
  const decoder = new TextDecoder();
  let text = '';
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) {
        await reader.cancel();
        throw new Error('BODY_TOO_LARGE');
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } finally {
    reader.releaseLock();
  }
  try { return JSON.parse(text); } catch { throw new Error('INVALID_JSON'); }
}
