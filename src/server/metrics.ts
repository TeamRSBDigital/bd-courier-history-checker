import { redisConfigured, redisPipeline } from './upstash.ts';
import type { CourierHistory, CourierName } from './types.ts';

type StringRecord = Record<string, string>;

export function normalizeRedisHash(value: unknown): StringRecord {
  if (Array.isArray(value)) {
    const out: StringRecord = {};
    for (let index = 0; index + 1 < value.length; index += 2) {
      const key = value[index];
      const item = value[index + 1];
      if (typeof key === 'string' && (typeof item === 'string' || typeof item === 'number')) out[key] = String(item);
    }
    return out;
  }
  if (typeof value === 'object' && value !== null) {
    const out: StringRecord = {};
    for (const [key, item] of Object.entries(value)) if (typeof item === 'string' || typeof item === 'number') out[key] = String(item);
    return out;
  }
  return {};
}

export async function recordCheckMetrics(
  outcome: 'success' | 'partial' | 'no_data' | 'failed',
  providers: CourierHistory[],
  latencies: Partial<Record<CourierName, number>> = {},
): Promise<void> {
  if (!redisConfigured()) return;
  const commands: string[][] = [
    ['HINCRBY', 'metrics:checks', 'total', '1'],
    ['HINCRBY', 'metrics:checks', outcome, '1'],
  ];
  const now = new Date().toISOString();
  for (const provider of providers) {
    commands.push(['HINCRBY', `metrics:provider:${provider.courier}`, provider.status, '1']);
    const latency = Math.max(0, Math.round(latencies[provider.courier] ?? 0));
    commands.push(['HINCRBY', 'metrics:latency', `${provider.courier}:total_ms`, String(latency)]);
    commands.push(['HINCRBY', 'metrics:latency', `${provider.courier}:calls`, '1']);
    if (provider.status !== 'ok' && provider.status !== 'no_data') {
      commands.push(['HSET', 'metrics:last_error', provider.courier, JSON.stringify({ status: provider.status, at: now })]);
    }
  }
  try { await redisPipeline(commands); } catch { /* metrics are non-critical */ }
}

export async function readMetrics(): Promise<Record<string, unknown>> {
  if (!redisConfigured()) return { storage: 'not_configured', checks: {}, providers: {}, latency: {}, errors: {}, rate_limit: {} };
  const response = await redisPipeline([
    ['HGETALL', 'metrics:checks'],
    ['HGETALL', 'metrics:provider:steadfast'],
    ['HGETALL', 'metrics:provider:pathao'],
    ['HGETALL', 'metrics:provider:redx'],
    ['HGETALL', 'metrics:provider:carrybee'],
    ['HGETALL', 'metrics:latency'],
    ['HGETALL', 'metrics:last_error'],
    ['HGETALL', 'metrics:rate_limit'],
  ]);
  const latencyRaw = normalizeRedisHash(response[5]?.result);
  const latency: Record<string, { calls: number; average_ms: number }> = {};
  for (const courier of ['steadfast', 'pathao', 'redx', 'carrybee'] as CourierName[]) {
    const calls = Number.parseInt(latencyRaw[`${courier}:calls`] ?? '0', 10) || 0;
    const total = Number.parseInt(latencyRaw[`${courier}:total_ms`] ?? '0', 10) || 0;
    latency[courier] = { calls, average_ms: calls > 0 ? Math.round(total / calls) : 0 };
  }
  const errorRaw = normalizeRedisHash(response[6]?.result);
  const errors: Record<string, unknown> = {};
  for (const [courier, serialized] of Object.entries(errorRaw)) {
    try {
      const parsed = JSON.parse(serialized) as unknown;
      if (typeof parsed === 'object' && parsed !== null) errors[courier] = parsed;
    } catch { /* ignore malformed diagnostic records */ }
  }
  return {
    storage: 'upstash',
    checks: normalizeRedisHash(response[0]?.result),
    providers: {
      steadfast: normalizeRedisHash(response[1]?.result),
      pathao: normalizeRedisHash(response[2]?.result),
      redx: normalizeRedisHash(response[3]?.result),
      carrybee: normalizeRedisHash(response[4]?.result),
    },
    latency,
    errors,
    rate_limit: normalizeRedisHash(response[7]?.result),
  };
}
