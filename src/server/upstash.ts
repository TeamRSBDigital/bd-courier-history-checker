import { env } from './env.ts';

interface RedisResult<T = unknown> { result?: T; error?: string }

function configured(): boolean {
  return Boolean(env.redisUrl && env.redisToken);
}

export function redisConfigured(): boolean {
  return configured();
}

async function request(path: string, commands: unknown): Promise<RedisResult[]> {
  if (!configured()) throw new Error('REDIS_NOT_CONFIGURED');
  const response = await fetch(`${env.redisUrl.replace(/\/$/, '')}${path}`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.redisToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(commands),
    signal: AbortSignal.timeout(2000),
    redirect: 'error',
  });
  if (!response.ok) throw new Error(`REDIS_HTTP_${response.status}`);
  const payload = await response.json() as RedisResult[] | { error?: string };
  if (!Array.isArray(payload)) throw new Error(payload.error || 'REDIS_INVALID_RESPONSE');
  return payload;
}

export async function redisTransaction(commands: string[][]): Promise<RedisResult[]> {
  return request('/multi-exec', commands);
}

export async function redisPipeline(commands: string[][]): Promise<RedisResult[]> {
  return request('/pipeline', commands);
}
