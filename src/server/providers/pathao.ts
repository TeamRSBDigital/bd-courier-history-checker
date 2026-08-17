import { env } from '../env.ts';
import type { CourierHistory, CourierProvider, ProviderConfigStatus } from '../types.ts';
import { mockHistory, unavailable } from './common.ts';

export class PathaoProvider implements CourierProvider {
  readonly name = 'pathao' as const;
  configurationStatus(): ProviderConfigStatus {
    if (!env.pathao.clientId || !env.pathao.clientSecret) {
      return { courier: this.name, state: 'missing_credentials', detail: 'Pathao Developer API merchant credentials are required.' };
    }
    return { courier: this.name, state: 'external_blocker', detail: 'Customer delivery-history endpoint and response contract require merchant-approved Pathao documentation.' };
  }
  async check(phone: string): Promise<CourierHistory> {
    const mock = mockHistory(this.name, phone);
    if (mock) return mock;
    return unavailable(this.name);
  }
}
