import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminMiddleware } from './middleware/admin.middleware';
import { ProductsController } from './products/products.controller';
import { OrdersController } from './orders/orders.controller';
import { UsersController } from './users/users.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';


@Module({
  imports: [TypeOrmModule.forRoot({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'user',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME ||'ecommerce',
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    autoLoadEntities: true,
    synchronize: true,
  }), ConfigModule.forRoot({ isGlobal: true }), AuthModule, UsersModule, ProductsModule, OrdersModule,
  JwtModule.registerAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => ({
      secret: process.env.JWT_SECRET || 'defaultSecret', // Use environment variable or default valueß
      signOptions: { expiresIn: '1h' },
    }),
  }),],
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