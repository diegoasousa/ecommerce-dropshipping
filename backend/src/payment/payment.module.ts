import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { MercadoPagoController } from '../mercadopago/mercadopago.controller';
import { MercadoPagoService } from '../common/services/mercado-pago.service';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [ProductsModule],
  controllers: [PaymentController, MercadoPagoController],
  providers: [MercadoPagoService],
  exports: [MercadoPagoService],
})
export class PaymentModule {}