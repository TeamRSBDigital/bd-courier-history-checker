import { env, isProduction } from './env.ts';
import { base64UrlDecode, base64UrlEncode, hmacHex, pbkdf2Hex, timingSafeEqualHex } from './crypto.ts';

const COOKIE = 'courier_admin_session';
interface SessionPayload { u: string; exp: number }

function parseCookies(request: Request): Record<string, string> {
  const raw = request.headers.get('cookie') ?? '';
  const result: Record<string, string> = {};
  for (const part of raw.split(';')) {
    const index = part.indexOf('=');
    if (index > 0) result[part.slice(0, index).trim()] = part.slice(index + 1).trim();
  }
  return result;
}

export function adminConfigured(): boolean {
  return Boolean(env.adminUsername && env.adminPasswordSalt && env.adminPasswordHash && env.adminSessionSecret.length >= 32);
}

export async function verifyAdminCredentials(username: unknown, password: unknown): Promise<boolean> {
  if (!adminConfigured() || typeof username !== 'string' || typeof password !== 'string' || password.length > 256) return false;
  if (username !== env.adminUsername) return false;
  const derived = await pbkdf2Hex(password, env.adminPasswordSalt);
  return timingSafeEqualHex(derived, env.adminPasswordHash);
}

export async function createSessionCookie(): Promise<string> {
  const payload: SessionPayload = { u: env.adminUsername, exp: Math.floor(Date.now() / 1000) + env.adminSessionTtlSeconds };
  const encoded = base64UrlEncode(JSON.stringify(payload));
  const signature = await hmacHex(env.adminSessionSecret, encoded);
  const secure = isProduction() ? '; Secure' : '';
  return `${COOKIE}=${encoded}.${signature}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${env.adminSessionTtlSeconds}${secure}`;
}

export function clearSessionCookie(): string {
  const secure = isProduction() ? '; Secure' : '';
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`;
}

export async function isAdminRequest(request: Request): Promise<boolean> {
  if (!adminConfigured()) return false;
  const token = parseCookies(request)[COOKIE];
  if (!token) return false;
  const dot = token.lastIndexOf('.');
  if (dot < 1) return false;
  const encoded = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const expected = await hmacHex(env.adminSessionSecret, encoded);
  if (!timingSafeEqualHex(signature, expected)) return false;
  const decoded = base64UrlDecode(encoded);
  if (!decoded) return false;
  try {
    const payload = JSON.parse(decoded) as SessionPayload;
    return payload.u === env.adminUsername && Number.isFinite(payload.exp) && payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}
