import { Injectable, Logger } from '@nestjs/common';
import { MercadoPagoService } from '../common/services/mercado-pago.service';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class MercadoPagoWebhookService {
  private readonly logger = new Logger(MercadoPagoWebhookService.name);

  constructor(
    private readonly mercadoPagoService: MercadoPagoService,
    private readonly ordersService: OrdersService,
  ) {}

  async processWebhook(body: any, query: any): Promise<any> {
    this.logger.log('Processando webhook do Mercado Pago...');
    
    try {
      // Processar webhook usando o MercadoPagoService
      const webhookResult = await this.mercadoPagoService.processWebhook(body, query);
      
      // Se o pagamento foi aprovado, atualizar status do pedido
      if (webhookResult.status === 'processed' && webhookResult.paymentStatus === 'approved') {
        this.logger.log(`Pagamento aprovado: ${webhookResult.paymentId}`);
        
        // Buscar pedido pela external_reference ou por outros métodos
        // Por enquanto, vamos atualizar todos os pedidos pendentes do usuário
        if (webhookResult.externalReference) {
          try {
            // Tentar interpretar external_reference como ID do pedido
            const orderId = parseInt(webhookResult.externalReference);
            if (!isNaN(orderId)) {
              await this.ordersService.updateOrderStatus(orderId, 'Em Processamento');
              this.logger.log(`Status do pedido ${orderId} atualizado para "Em Processamento"`);
            }
          } catch (error) {
            this.logger.error('Erro ao atualizar status do pedido:', error);
          }
        }
      }
      
      return webhookResult;
    } catch (error) {
      this.logger.error('Erro ao processar webhook:', error);
      throw error;
    }
  }
}
