import { Injectable, NestMiddleware, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AdminMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // Libera GET /products para acesso público
      if (req.method === 'GET' && req.url === '/products') {
        return next();
      }

      const authHeader = req.headers.authorization;
      if (!authHeader) {
        throw new UnauthorizedException('Token não encontrado');
      }

      const token = authHeader.split(' ')[1];
      const decoded = this.jwtService.verify(token);
      if (!decoded || !decoded.userId) {
        throw new UnauthorizedException('Token inválido');
      }

      const user = await this.usersService.findById(decoded.id);
      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado');
      }

      if (user.role !== 'admin') {
        throw new ForbiddenException('Acesso negado, privilégios insuficientes');
      }

      next(); // Permite acesso ao próximo middleware ou controlador
    } catch (error) {
      throw new UnauthorizedException(error.message || 'Erro na autenticação');
    }
  }
}