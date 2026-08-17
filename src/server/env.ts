function intEnv(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

export const env = {
  appUrl: process.env.APP_URL ?? 'http://localhost:3000',
  appEnv: process.env.APP_ENV ?? process.env.VERCEL_ENV ?? 'development',
  vercelEnv: process.env.VERCEL_ENV ?? '',
  vercelUrl: process.env.VERCEL_URL ?? '',
  phoneHmacSecret: process.env.PHONE_HMAC_SECRET ?? '',
  redisUrl: process.env.UPSTASH_REDIS_REST_URL ?? '',
  redisToken: process.env.UPSTASH_REDIS_REST_TOKEN ?? '',
  rateLimitRequests: intEnv('RATE_LIMIT_REQUESTS', 20, 1, 1000),
  rateLimitWindowSeconds: intEnv('RATE_LIMIT_WINDOW_SECONDS', 60, 10, 86400),
  adminUsername: process.env.ADMIN_USERNAME ?? 'admin',
  adminPasswordSalt: process.env.ADMIN_PASSWORD_SALT ?? '',
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH ?? '',
  adminSessionSecret: process.env.ADMIN_SESSION_SECRET ?? '',
  adminSessionTtlSeconds: intEnv('ADMIN_SESSION_TTL_SECONDS', 28800, 300, 86400),
  riskMinOrders: intEnv('RISK_MIN_ORDERS', 3, 1, 1000),
  riskHighMax: intEnv('RISK_HIGH_MAX_SUCCESS_RATE', 60, 0, 99),
  riskModerateMax: intEnv('RISK_MODERATE_MAX_SUCCESS_RATE', 80, 1, 100),
  courierTimeoutMs: intEnv('COURIER_TIMEOUT_MS', 3500, 500, 15000),
  mockCouriers: process.env.MOCK_COURIERS === 'true',
  steadfast: {
    apiUrl: process.env.STEADFAST_API_URL ?? 'https://portal.packzy.com/api/v1',
    apiKey: process.env.STEADFAST_API_KEY ?? '',
    secretKey: process.env.STEADFAST_SECRET_KEY ?? '',
  },
  pathao: {
    apiUrl: process.env.PATHAO_API_URL ?? '',
    clientId: process.env.PATHAO_CLIENT_ID ?? '',
    clientSecret: process.env.PATHAO_CLIENT_SECRET ?? '',
  },
  redx: {
    apiUrl: process.env.REDX_API_URL ?? '',
    apiKey: process.env.REDX_API_KEY ?? '',
  },
  carrybee: {
    apiUrl: process.env.CARRYBEE_API_URL ?? '',
    apiKey: process.env.CARRYBEE_API_KEY ?? '',
  },
};

export function isProduction(): boolean {
  return env.vercelEnv === 'production' || env.appEnv === 'production';
}

export function isMockAllowed(): boolean {
  return env.mockCouriers && !isProduction();
}
