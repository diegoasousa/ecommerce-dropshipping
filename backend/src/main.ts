import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AdminMiddleware } from './middleware/admin.middleware';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Enable global validation with better error handling
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Remove non-decorated properties
    forbidNonWhitelisted: true, // Throw error for non-whitelisted properties
    transform: true, // Auto-transform types
    disableErrorMessages: process.env.NODE_ENV === 'production', // Hide error details in production
  }));

  // Configure CORS with environment variables
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? [frontendUrl] 
    : ['http://localhost:3000', 'http://localhost:4200', 'http://localhost:4400'];

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  
  // SERVE ARQUIVOS ESTÁTICOS DA PASTA uploads
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
}
bootstrap();
