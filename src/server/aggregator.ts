import { aggregateHistory } from './risk.ts';
import type { CheckResponse, CourierHistory, CourierName, CourierProvider } from './types.ts';
import { providers } from './providers/index.ts';

const DISCLAIMER = 'Risk indicators are based on available courier delivery history and should not be treated as proof of fraudulent activity.';

function rejected(courier: CourierName, reason: unknown): CourierHistory {
  const name = reason instanceof Error ? reason.name : '';
  return {
    courier,
    available: false,
    status: name === 'TimeoutError' || name === 'AbortError' ? 'timeout' : 'unavailable',
    total: 0,
    delivered: 0,
    returned: 0,
    cancelled: 0,
    success_rate: null,
    message: 'Temporarily unavailable',
  };
}

export interface CourierCheckExecution {
  response: CheckResponse;
  latencies: Partial<Record<CourierName, number>>;
}

export async function executeCourierCheck(phone: string, phoneMasked: string, activeProviders: CourierProvider[] = providers): Promise<CourierCheckExecution> {
  const executions = await Promise.all(activeProviders.map(async (provider) => {
    const started = Date.now();
    try {
      const history = await provider.check(phone);
      return { history, latencyMs: Math.max(0, Date.now() - started) };
    } catch (reason) {
      return { history: rejected(provider.name, reason), latencyMs: Math.max(0, Date.now() - started) };
    }
  }));
  const couriers = executions.map((item) => item.history);
  const latencies: Partial<Record<CourierName, number>> = {};
  executions.forEach((item, index) => { latencies[activeProviders[index].name] = item.latencyMs; });
  return {
    response: {
      phone_masked: phoneMasked,
      summary: aggregateHistory(couriers),
      couriers,
      checked_at: new Date().toISOString(),
      disclaimer: DISCLAIMER,
    },
    latencies,
  };
}

export async function checkAllCouriers(phone: string, phoneMasked: string, activeProviders: CourierProvider[] = providers): Promise<CheckResponse> {
  return (await executeCourierCheck(phone, phoneMasked, activeProviders)).response;
}
