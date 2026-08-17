import { env } from './env.ts';
import type { CourierHistory, RiskSummary, RiskLabel } from './types.ts';

export function percent(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  return Math.round((numerator / denominator) * 10000) / 100;
}

export function calculateRisk(successRate: number | null, totalOrders: number, reporting: number): RiskLabel {
  if (reporting === 0 || totalOrders < env.riskMinOrders || successRate === null) return 'INSUFFICIENT_DATA';
  if (successRate < env.riskHighMax) return 'HIGH';
  if (successRate < env.riskModerateMax) return 'MODERATE';
  return 'LOW';
}

export function aggregateHistory(results: CourierHistory[]): RiskSummary {
  const compatible = results.filter((item) => item.available && item.status === 'ok' && item.total >= 0);
  const total = compatible.reduce((sum, item) => sum + item.total, 0);
  const delivered = compatible.reduce((sum, item) => sum + item.delivered, 0);
  const returnedCancelled = compatible.reduce((sum, item) => sum + item.returned + item.cancelled, 0);
  const successRate = percent(delivered, total);
  return {
    total_orders: total,
    delivered,
    returned_cancelled: returnedCancelled,
    success_rate: successRate,
    return_rate: percent(returnedCancelled, total),
    couriers_reporting: compatible.length,
    risk: calculateRisk(successRate, total, compatible.length),
  };
}
