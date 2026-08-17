export type CourierName = 'steadfast' | 'pathao' | 'redx' | 'carrybee';
export type RiskLabel = 'LOW' | 'MODERATE' | 'HIGH' | 'INSUFFICIENT_DATA';
export type ProviderStatus = 'ok' | 'no_data' | 'unavailable' | 'timeout' | 'rate_limited' | 'auth_error' | 'invalid_response';

export interface CourierHistory {
  courier: CourierName;
  available: boolean;
  status: ProviderStatus;
  total: number;
  delivered: number;
  returned: number;
  cancelled: number;
  success_rate: number | null;
  message?: string;
}

export interface RiskSummary {
  total_orders: number;
  delivered: number;
  returned_cancelled: number;
  success_rate: number | null;
  return_rate: number | null;
  couriers_reporting: number;
  risk: RiskLabel;
}

export interface CheckResponse {
  phone_masked: string;
  summary: RiskSummary;
  couriers: CourierHistory[];
  checked_at: string;
  disclaimer: string;
}

export interface ProviderConfigStatus {
  courier: CourierName;
  state: 'configured' | 'missing_credentials' | 'external_blocker';
  detail: string;
}

export interface CourierProvider {
  readonly name: CourierName;
  configurationStatus(): ProviderConfigStatus;
  check(phone: string): Promise<CourierHistory>;
}
