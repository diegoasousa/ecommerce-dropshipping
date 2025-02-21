import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from './entities/order.entity';
import { User } from '../users/user.entity';
import { Product } from '../products/entities/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, User, Product])], // 🔹 Importando repositórios
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService], // 🔹 Exportando para outros módulos se necessário
})
export class OrdersModule {}