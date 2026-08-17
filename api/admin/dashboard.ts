import { adminConfigured, isAdminRequest } from '../../src/server/auth.ts';
import { json, safePublicError } from '../../src/server/http.ts';
import { readMetrics } from '../../src/server/metrics.ts';
import { providerConfigurationStatuses } from '../../src/server/providers/index.ts';
import { isProduction } from '../../src/server/env.ts';
import { redisConfigured } from '../../src/server/upstash.ts';

export async function GET(request: Request): Promise<Response> {
  if (!(await isAdminRequest(request))) return safePublicError(401, 'UNAUTHORIZED', 'Authentication required.');
  let metrics: Record<string, unknown>;
  try { metrics = await readMetrics(); }
  catch { metrics = { storage: 'temporarily_unavailable', checks: {}, providers: {} }; }
  const application = { environment: isProduction() ? 'production' : 'non_production', shared_store: redisConfigured() ? 'configured' : 'not_configured', admin_auth: adminConfigured() ? 'configured' : 'not_configured' };
  return json({ application, providers: providerConfigurationStatuses(), metrics, generated_at: new Date().toISOString() });
}
export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'GET') return safePublicError(405, 'METHOD_NOT_ALLOWED', 'Use GET for the admin dashboard.');
    return GET(request);
  },
};
