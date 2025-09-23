import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
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
    const backendUrl = this.configService.get<string>('BACKEND_URL') || 'http://localhost:3001';
    const nodeEnv = this.configService.get<string>('NODE_ENV') || 'development';
    
    console.log('Frontend URL configurada:', frontendUrl);
    console.log('Backend URL configurada:', backendUrl);
    console.log('Ambiente:', nodeEnv);
    
    // Configuração base da preferência
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
      notification_url: `${backendUrl}/mercadopago/webhook`,
      external_reference: order.orderId?.toString() || `order_${Date.now()}`,
    };

    // Adicionar back_urls apenas se não for localhost (desenvolvimento)
    const isLocalhost = frontendUrl.includes('localhost') || frontendUrl.includes('127.0.0.1');
    
    if (!isLocalhost) {
      preference.back_urls = {
        success: `${frontendUrl}/payment/success`,
        failure: `${frontendUrl}/payment/failure`,
        pending: `${frontendUrl}/payment/pending`,
      };
      preference.auto_return = 'all';
      console.log('Back URLs adicionadas para ambiente de produção');
    } else {
      console.log('Back URLs omitidas para ambiente de desenvolvimento (localhost)');
    }

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
      throw error;
    }
  }

  async processWebhook(body: any, query: any): Promise<any> {
    console.log('Processando webhook do Mercado Pago...');
    
    // Verificar o tipo de notificação
    const { type, data } = body;
    
    if (!type || !data) {
      console.log('Webhook sem type ou data, ignorando...');
      return { status: 'ignored', reason: 'Missing type or data' };
    }

    // Processar apenas notificações de pagamento
    if (type === 'payment') {
      const paymentId = data.id;
      console.log(`Processando pagamento ID: ${paymentId}`);
      
      try {
        // Consultar detalhes do pagamento na API do Mercado Pago
        const paymentClient = new Payment(this.mp);
        const payment = await paymentClient.get({ id: paymentId });
        
        console.log('Detalhes do pagamento:', JSON.stringify(payment, null, 2));
        
        // Verificar se o pagamento foi aprovado
        if (payment.status === 'approved') {
          console.log('Pagamento aprovado! Atualizando status do pedido...');
          
          return {
            status: 'processed',
            paymentId: paymentId,
            paymentStatus: payment.status,
            amount: payment.transaction_amount,
            externalReference: payment.external_reference
          };
        } else {
          console.log(`Pagamento com status: ${payment.status}, não processando...`);
          return {
            status: 'not_processed',
            paymentId: paymentId,
            paymentStatus: payment.status,
            reason: 'Payment not approved'
          };
        }
      } catch (error) {
        console.error('Erro ao consultar pagamento:', error);
        
        // Se o pagamento não foi encontrado, retornar erro específico
        if (error.status === 404) {
          return {
            status: 'error',
            paymentId: paymentId,
            reason: 'Payment not found',
            error: error.message
          };
        }
        
        throw error;
      }
    }
    
    return { status: 'ignored', reason: 'Not a payment notification' };
  }
}