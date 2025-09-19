import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { MercadoPagoService } from '../common/services/mercado-pago.service';

@Controller('mercadopago')
export class MercadoPagoController {
  constructor(private readonly mercadoPagoService: MercadoPagoService) {}

  @Get('public-key')
  getPublicKey() {
    return {
      public_key: this.mercadoPagoService.getPublicKey()
    };
  }

  @Get('config')
  getConfig() {
    return {
      public_key: this.mercadoPagoService.getPublicKey(),
      client_id: this.mercadoPagoService.getClientId()
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
}