import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { MercadoPagoPreferenceRequest, MercadoPagoPreferenceResponse } from '../../types/mercado-pago.types';
 
@Injectable()
export class MercadoPagoService {
  private readonly mp: MercadoPagoConfig;
  private readonly publicKey: string;
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(private readonly configService: ConfigService) {
    const accessToken = this.configService.get<string>('MERCADO_PAGO_ACCESS_TOKEN');
    const publicKey = this.configService.get<string>('MERCADO_PAGO_PUBLIC_KEY');
    const clientId = this.configService.get<string>('MERCADO_PAGO_CLIENT_ID');
    const clientSecret = this.configService.get<string>('MERCADO_PAGO_CLIENT_SECRET');
    
    if (!accessToken) {
      throw new Error('MERCADO_PAGO_ACCESS_TOKEN is not defined in environment variables');
    }

    if (!publicKey) {
      throw new Error('MERCADO_PAGO_PUBLIC_KEY is not defined in environment variables');
    }

    if (!clientId) {
      throw new Error('MERCADO_PAGO_CLIENT_ID is not defined in environment variables');
    }

    if (!clientSecret) {
      throw new Error('MERCADO_PAGO_CLIENT_SECRET is not defined in environment variables');
    }

    this.publicKey = publicKey;
    this.clientId = clientId;
    this.clientSecret = clientSecret;

    this.mp = new MercadoPagoConfig({
      accessToken,
    });
  }

  getPublicKey(): string {
    return this.publicKey;
  }

  getClientId(): string {
    return this.clientId;
  }

  getClientSecret(): string {
    return this.clientSecret;
  }

  async createPreference(order: any): Promise<MercadoPagoPreferenceResponse> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4400';
    
    console.log('Frontend URL configurada:', frontendUrl);
    
    // Tentar sem auto_return primeiro, que é opcional
    const preference: any = {
      items: order.items.map((item: any, index: number) => ({
        id: `${index + 1}`,
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unit_price,
        currency_id: item.currency_id || 'BRL',
      })),
      payer: {
        name: order.customer?.name || 'Cliente',
        email: order.customer?.email || 'sem-email@dominio.com',
      },
      back_urls: {
        success: `${frontendUrl}/payment/success`,
        failure: `${frontendUrl}/payment/failure`,
        pending: `${frontendUrl}/payment/pending`,
      },
      // Usar 'all' ao invés de 'approved' que é mais restritivo
      auto_return: 'all',
    };

    console.log('Dados recebidos no MercadoPagoService:', JSON.stringify(order, null, 2));
    console.log('Preferência enviada ao Mercado Pago:', JSON.stringify(preference, null, 2));

    const client = new Preference(this.mp);
    
    try {
      const result = await client.create({ body: preference });
      console.log('Resposta do Mercado Pago - SUCESSO:', result);
      
      // Type-safe conversion
      return {
        id: result.id || '',
        init_point: result.init_point || '',
        sandbox_init_point: result.sandbox_init_point || '',
        date_created: result.date_created || '',
        operation_type: result.operation_type || '',
        items: result.items || []
      } as MercadoPagoPreferenceResponse;
    } catch (error) {
      console.error('ERRO do Mercado Pago:', error);
      
      // Se der erro com back_urls, tentar versão simplificada
      if (error.message && error.message.includes('back_url')) {
        console.log('Tentando versão simplificada sem back_urls...');
        
        const simplePreference = {
          items: preference.items,
          payer: preference.payer,
        };
        
        console.log('Preferência simplificada:', JSON.stringify(simplePreference, null, 2));
        
        const result = await client.create({ body: simplePreference });
        console.log('Resposta do Mercado Pago - SUCESSO (simplificada):', result);
        
        return {
          id: result.id || '',
          init_point: result.init_point || '',
          sandbox_init_point: result.sandbox_init_point || '',
          date_created: result.date_created || '',
          operation_type: result.operation_type || '',
          items: result.items || []
        } as MercadoPagoPreferenceResponse;
      }
      
      throw error;
    }
  }
}