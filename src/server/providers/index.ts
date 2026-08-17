import type { CourierProvider, ProviderConfigStatus } from '../types.ts';
import { CarrybeeProvider } from './carrybee.ts';
import { PathaoProvider } from './pathao.ts';
import { RedxProvider } from './redx.ts';
import { SteadfastProvider } from './steadfast.ts';

export const providers: CourierProvider[] = [
  new SteadfastProvider(),
  new PathaoProvider(),
  new RedxProvider(),
  new CarrybeeProvider(),
];

export function providerConfigurationStatuses(): ProviderConfigStatus[] {
  return providers.map((provider) => provider.configurationStatus());
}
