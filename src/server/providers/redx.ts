import { env } from '../env.ts';
import type { CourierHistory, CourierProvider, ProviderConfigStatus } from '../types.ts';
import { mockHistory, unavailable } from './common.ts';

export class RedxProvider implements CourierProvider {
  readonly name = 'redx' as const;
  configurationStatus(): ProviderConfigStatus {
    if (!env.redx.apiKey) {
      return { courier: this.name, state: 'missing_credentials', detail: 'Authorized RedX Developer API credentials are required.' };
    }
    return { courier: this.name, state: 'external_blocker', detail: 'Customer delivery-history endpoint and response contract require merchant-approved RedX documentation.' };
  }
  async check(phone: string): Promise<CourierHistory> {
    const mock = mockHistory(this.name, phone);
    if (mock) return mock;
    return unavailable(this.name);
  }
}
