// src/middleware/admin.middleware.ts
import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CustomRequest } from '../types/express';

@Injectable()
export class AdminMiddleware implements NestMiddleware {
  use(req: CustomRequest, res: Response, next: NextFunction) {
    if (!req.user || req.user.role !== 'admin') {
      throw new UnauthorizedException('Acesso permitido apenas para administradores');
    }
    next();
  }
}
