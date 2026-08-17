import { env } from '../env.ts';
import { percent } from '../risk.ts';
import type { CourierHistory, CourierProvider, ProviderConfigStatus } from '../types.ts';
import { fetchWithTimeout, mockHistory, readResponseTextLimited, safeCount, unavailable } from './common.ts';

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

export function parseSteadfastPayload(payload: unknown): CourierHistory | null {
  const root = asRecord(payload);
  if (!root) return null;
  const data = asRecord(root.data) ?? root;
  const total = safeCount(data.Total_parcels ?? data.total_parcels ?? data.total ?? data.total_orders);
  const delivered = safeCount(data.total_delivered ?? data.delivered ?? data.success);
  const cancelled = safeCount(data.total_cancelled ?? data.cancelled ?? data.cancel);
  const returned = safeCount(data.total_returned ?? data.returned) ?? 0;
  if (total === null || delivered === null || cancelled === null) return null;
  if (delivered + cancelled + returned > total) return null;
  return {
    courier: 'steadfast',
    available: true,
    status: total === 0 ? 'no_data' : 'ok',
    total,
    delivered,
    returned,
    cancelled,
    success_rate: percent(delivered, total),
    ...(total === 0 ? { message: 'No delivery history found' } : {}),
  };
}

export class SteadfastProvider implements CourierProvider {
  readonly name = 'steadfast' as const;

  configurationStatus(): ProviderConfigStatus {
    if (!env.steadfast.apiKey || !env.steadfast.secretKey) {
      return { courier: this.name, state: 'missing_credentials', detail: 'Authorized Steadfast API key and secret are required.' };
    }
    return { courier: this.name, state: 'configured', detail: 'Authorized fraud-check API configuration is present; real API verification still depends on valid merchant credentials.' };
  }

  async check(phone: string): Promise<CourierHistory> {
    const mock = mockHistory(this.name, phone);
    if (mock) return mock;
    if (!env.steadfast.apiKey || !env.steadfast.secretKey) return unavailable(this.name);
    const base = env.steadfast.apiUrl.replace(/\/$/, '');
    if (!base.startsWith('https://')) return unavailable(this.name);
    try {
      const response = await fetchWithTimeout(`${base}/fraud_check/${encodeURIComponent(phone)}`, {
        method: 'GET',
        headers: {
          'Api-Key': env.steadfast.apiKey,
          'Secret-Key': env.steadfast.secretKey,
          accept: 'application/json',
        },
      });
      if (response.status === 401 || response.status === 403) return { ...unavailable(this.name), status: 'auth_error' };
      if (response.status === 429) return { ...unavailable(this.name), status: 'rate_limited' };
      if (!response.ok) return unavailable(this.name);
      const text = await readResponseTextLimited(response, 100_000);
      if (text === null) return { ...unavailable(this.name), status: 'invalid_response' };
      let payload: unknown;
      try { payload = JSON.parse(text); } catch { return { ...unavailable(this.name), status: 'invalid_response' }; }
      return parseSteadfastPayload(payload) ?? { ...unavailable(this.name), status: 'invalid_response' };
    } catch (error) {
      const name = error instanceof Error ? error.name : '';
      return name === 'TimeoutError' || name === 'AbortError'
        ? { ...unavailable(this.name), status: 'timeout' }
        : unavailable(this.name);
    }
  }
}
