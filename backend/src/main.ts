import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AdminMiddleware } from './middleware/admin.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe()); // Enable validation pipe
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' ? 'https://sua-url-de-producao.com' : 'http://localhost:4200',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  }); 
  app.use('/admin', AdminMiddleware);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
