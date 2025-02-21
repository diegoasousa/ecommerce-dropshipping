import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AdminMiddleware } from './middleware/admin.middleware';
import { ProductsController } from './products/products.controller';
import { OrdersController } from './orders/orders.controller';
import { UsersController } from './users/users.controller';


@Module({
  imports: [TypeOrmModule.forRoot({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'user',
    password: 'password',
    database: 'ecommerce',
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    synchronize: true,
  }), ConfigModule.forRoot({ isGlobal: true }), AuthModule, UsersModule, ProductsModule, OrdersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AdminMiddleware)
      .forRoutes(UsersController,ProductsController, OrdersController);
  }
}