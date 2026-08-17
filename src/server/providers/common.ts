import { env, isMockAllowed } from '../env.ts';
import { percent } from '../risk.ts';
import type { CourierHistory, CourierName } from '../types.ts';

export function unavailable(courier: CourierName, message = 'Temporarily unavailable'): CourierHistory {
  return { courier, available: false, status: 'unavailable', total: 0, delivered: 0, returned: 0, cancelled: 0, success_rate: null, message };
}

export function mockHistory(courier: CourierName, phone: string): CourierHistory | null {
  if (!isMockAllowed()) return null;
  const seed = Number(phone.slice(-2));
  const base: Record<CourierName, number> = { steadfast: 3, pathao: 5, redx: 7, carrybee: 11 };
  const total = (seed + base[courier]) % 12;
  if (total === 0) return { courier, available: true, status: 'no_data', total: 0, delivered: 0, returned: 0, cancelled: 0, success_rate: null, message: 'No delivery history found' };
  const failures = Math.min(total, (seed + base[courier]) % 4);
  const returned = Math.floor(failures / 2);
  const cancelled = failures - returned;
  const delivered = total - failures;
  return { courier, available: true, status: 'ok', total, delivered, returned, cancelled, success_rate: percent(delivered, total) };
}

export async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  return fetch(url, { ...init, signal: AbortSignal.timeout(env.courierTimeoutMs), cache: 'no-store', redirect: 'error' });
}

export function safeCount(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return Math.floor(value);
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number.parseInt(value, 10);
  return null;
}

export async function readResponseTextLimited(response: Response, maxBytes = 100_000): Promise<string | null> {
  const reader = response.body?.getReader();
  if (!reader) return '';
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
        return null;
      }
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } finally {
    reader.releaseLock();
  }
}
