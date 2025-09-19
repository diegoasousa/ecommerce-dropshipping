export interface MercadoPagoPreferenceItem {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
  currency_id: string;
  description?: string;
  picture_url?: string;
}

export interface MercadoPagoPayer {
  name: string;
  email: string;
}

export interface MercadoPagoBackUrls {
  success: string;
  failure: string;
  pending: string;
}

export interface MercadoPagoPreferenceRequest {
  items: MercadoPagoPreferenceItem[];
  payer: MercadoPagoPayer;
  back_urls: MercadoPagoBackUrls;
  auto_return?: string;
  notification_url?: string;
}

export interface MercadoPagoPreferenceResponse {
  id: string;
  init_point: string;
  sandbox_init_point: string;
  date_created: string;
  operation_type: string;
  items: MercadoPagoPreferenceItem[];
}