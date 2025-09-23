import { Controller, Post, Body, Get, Query, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoService } from '../common/services/mercado-pago.service';
import { OrdersService } from '../orders/orders.service';

@Controller('mercadopago')
export class MercadoPagoController {
  private readonly logger = new Logger(MercadoPagoController.name);
  
  constructor(
    private readonly mercadoPagoService: MercadoPagoService,
    private readonly ordersService: OrdersService,
    private readonly configService: ConfigService,
  ) {}

  @Get('public-key')
  getPublicKey() {
    return {
      public_key: this.mercadoPagoService.getPublicKey()
    };
  }

  @Get('config')
  getConfig() {
    const backendUrl = this.configService.get<string>('BACKEND_URL') || 'http://localhost:3001';
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4400';
    const nodeEnv = this.configService.get<string>('NODE_ENV') || 'development';
    
    return {
      public_key: this.mercadoPagoService.getPublicKey(),
      client_id: this.mercadoPagoService.getClientId(),
      webhook_url: `${backendUrl}/mercadopago/webhook`,
      frontend_url: frontendUrl,
      backend_url: backendUrl,
      environment: nodeEnv,
      back_urls_enabled: !frontendUrl.includes('localhost')
    };
  }

  @Post('create_preference')
  async createPreference(@Body() body) {
    try {
      if (!body.items || !Array.isArray(body.items)) {
        return { error: 'Itens inválidos para criar a preferência' };
      }

      const preference = await this.mercadoPagoService.createPreference(body);
      return preference;
    } catch (error) {
      console.error('Erro ao criar preferência Mercado Pago:', error);
      return { error: error.message };
    }
  }

  @Get('feedback')
  getFeedback(@Query() query) {
    return {
      payment_id: query.payment_id,
      status: query.status,
      merchant_order_id: query.merchant_order_id
    };
  }

  @Post('webhook')
  async handleWebhook(@Body() body: any, @Query() query: any) {
    this.logger.log('Webhook recebido do Mercado Pago');
    this.logger.log('Query params:', JSON.stringify(query, null, 2));
    this.logger.log('Body:', JSON.stringify(body, null, 2));

    try {
      // Processar notificação do Mercado Pago
      const result = await this.mercadoPagoService.processWebhook(body, query);
      this.logger.log('Webhook processado com sucesso:', result);
      
      // Se o pagamento foi aprovado, atualizar status do pedido
      if (result.status === 'processed' && result.paymentStatus === 'approved') {
        this.logger.log(`Pagamento aprovado: ${result.paymentId}`);
        
        // Buscar pedido pela external_reference
        if (result.externalReference) {
          try {
            const orderId = parseInt(result.externalReference);
            if (!isNaN(orderId)) {
              await this.ordersService.updateOrderStatus(orderId, 'Em Processamento');
              this.logger.log(`Status do pedido ${orderId} atualizado para "Em Processamento"`);
            }
          } catch (error) {
            this.logger.error('Erro ao atualizar status do pedido:', error);
          }
        }
      }
      
      return { status: 'success', message: 'Webhook processado com sucesso' };
    } catch (error) {
      this.logger.error('Erro ao processar webhook:', error);
      return { status: 'error', message: 'Erro ao processar webhook' };
    }
  }

  @Post('webhook-test')
  async handleWebhookTest(@Body() body: any) {
    this.logger.log('Webhook de teste recebido');
    this.logger.log('Body:', JSON.stringify(body, null, 2));

    try {
      // Simular um pagamento aprovado para teste
      const mockPaymentResult = {
        status: 'processed',
        paymentId: body.paymentId || '123456',
        paymentStatus: 'approved',
        amount: body.amount || 100.0,
        externalReference: body.orderId?.toString() || '1'
      };

      this.logger.log('Simulando pagamento aprovado:', mockPaymentResult);

      // Atualizar status do pedido se external_reference foi fornecido
      if (mockPaymentResult.externalReference) {
        try {
          const orderId = parseInt(mockPaymentResult.externalReference);
          if (!isNaN(orderId)) {
            await this.ordersService.updateOrderStatus(orderId, 'Em Processamento');
            this.logger.log(`Status do pedido ${orderId} atualizado para "Em Processamento"`);
          }
        } catch (error) {
          this.logger.error('Erro ao atualizar status do pedido:', error);
        }
      }

      return { status: 'success', message: 'Webhook de teste processado com sucesso', data: mockPaymentResult };
    } catch (error) {
      this.logger.error('Erro ao processar webhook de teste:', error);
      return { status: 'error', message: 'Erro ao processar webhook de teste' };
    }
  }

  @Post('test-update-order')
  async testUpdateOrder(@Body() body: { orderId: number }) {
    this.logger.log('Testando atualização de status do pedido:', body);
    
    try {
      const orderId = body.orderId;
      if (!orderId || isNaN(orderId)) {
        return { status: 'error', message: 'orderId inválido' };
      }

      await this.ordersService.updateOrderStatus(orderId, 'Em Processamento');
      this.logger.log(`Status do pedido ${orderId} atualizado para "Em Processamento"`);
      
      return { 
        status: 'success', 
        message: `Pedido ${orderId} atualizado para "Em Processamento"`,
        orderId: orderId
      };
    } catch (error) {
      this.logger.error('Erro ao atualizar pedido:', error);
      return { status: 'error', message: error.message };
    }
  }
}