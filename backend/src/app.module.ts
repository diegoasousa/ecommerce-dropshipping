import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { getDatabaseConfig } from './config/database.config';
import { AdminMiddleware } from './middleware/admin.middleware';
import { OrdersController } from './orders/orders.controller';
import { OrdersModule } from './orders/orders.module';
import { PaymentModule } from './payment/payment.module';
import { ProductsController } from './products/products.controller';
import { ProductsModule } from './products/products.module';
import { UsersController } from './users/users.controller';
import { UsersModule } from './users/users.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'user',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'ecommerce',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV !== 'production' ? ['query', 'error'] : ['error'],
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    }),
    AuthModule,
    UsersModule,
    ProductsModule,
    OrdersModule,
    PaymentModule,
  ],
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