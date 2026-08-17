import { env } from '../env.ts';
import type { CourierHistory, CourierProvider, ProviderConfigStatus } from '../types.ts';
import { mockHistory, unavailable } from './common.ts';

export class CarrybeeProvider implements CourierProvider {
  readonly name = 'carrybee' as const;
  configurationStatus(): ProviderConfigStatus {
    if (!env.carrybee.apiKey) {
      return { courier: this.name, state: 'missing_credentials', detail: 'Authorized CarryBee merchant API credentials are required.' };
    }
    return { courier: this.name, state: 'external_blocker', detail: 'Customer delivery-history endpoint and response contract require merchant-approved CarryBee documentation.' };
  }
  async check(phone: string): Promise<CourierHistory> {
    const mock = mockHistory(this.name, phone);
    if (mock) return mock;
    return unavailable(this.name);
  }
}
