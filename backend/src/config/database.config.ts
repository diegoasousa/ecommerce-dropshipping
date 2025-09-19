import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => {
  const isProduction = configService.get<string>('NODE_ENV') === 'production';
  
  return {
    type: 'postgres',
    host: configService.get<string>('DB_HOST') || 'localhost',
    port: parseInt(configService.get<string>('DB_PORT') || '5432', 10),
    username: configService.get<string>('DB_USERNAME') || 'user',
    password: configService.get<string>('DB_PASSWORD') || 'password',
    database: configService.get<string>('DB_NAME') || 'ecommerce',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    autoLoadEntities: true,
    synchronize: !isProduction, // Only sync in development
    logging: !isProduction ? ['query', 'error'] : ['error'], // Log queries in development
    ssl: isProduction ? { rejectUnauthorized: false } : false, // SSL for production
    migrations: ['dist/migrations/*{.ts,.js}'],
    migrationsTableName: 'migrations',
    migrationsRun: isProduction, // Auto-run migrations in production
  };
};