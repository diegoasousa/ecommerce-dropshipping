import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Get,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}


  @Get('me')
async me(@Req() req: any, @Res() res: Response) {
  const fromHeader = (req.headers?.authorization || '').replace(/^Bearer\s+/i, '').trim();
  const fromCookie = req.cookies?.auth_token;
  const token = fromCookie || fromHeader;
  if (!token) {
    return res.status(401).json({ message: 'missing token' });
  }

  const payload = (() => {
    try {
      const [, base64url] = token.split('.');
      if (!base64url) return null;
      const json = Buffer.from(base64url.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
      return JSON.parse(json);
    } catch {
      return null;
    }
  })();

  if (!payload) {
    return res.status(401).json({ message: 'invalid token' });
  }

  // Se o token já tiver email/name, retornamos direto
  const data: any = {
    id: payload.id ?? payload.sub?.id ?? null,
    role: payload.role ?? payload.sub?.role ?? null,
    email: payload.email ?? payload.user?.email ?? null,
    name: payload.name ?? payload.user?.name ?? null,
  };

  // Se não tiver email mas tiver id, você pode (opcional) buscar no banco:
  // if (!data.email && data.id) {
  //   const u = await this.usersService.findById(data.id);
  //   if (u) {
  //     data.email = u.email;
  //     data.name = u.name;
  //     data.role = data.role ?? u.role;
  //   }
  // }

  return res.json(data);
}

  @Get('debug')
  async debug() {
    return {
      googleClientId: process.env.GOOGLE_CLIENT_ID,
      googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL,
      port: process.env.PORT,
      frontendUrl: process.env.FRONTEND_URL,
    };
  }

  // ========================
  // Local auth
  // ========================
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const user: any = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Usuário ou senha inválidos');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Usuário ou senha inválidos');
    }

    return {
      token: await this.authService.generateToken({
        id: user.id,
        role: user.role,
        email: user.email,
        name: user.name,
      }),
    };
  }

  @Post('register-admin')
  async registerAdmin(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto, 'admin');
  }

  // ======================
  // Google OAuth
  // ========================
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // O Nest redireciona automaticamente para o Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: any, @Res() res: Response) {
    // Espera-se que `req.user` tenha sido populado pela GoogleStrategy.validate
    const { email, name, avatar } = (req?.user ?? {}) as {
      email?: string;
      name?: string;
      avatar?: string;
    };

    if (!email) {
      return res.redirect(this.getFrontendUrl() + '/login/callback?error=missing_email');
    }
  

    // 1) Busca usuário existente
    let user: any = await this.usersService.findByEmail(email);

    // 2) Cria caso não exista (senha aleatória, já que é social)
    if (!user) {
      const created = await this.authService.register({
        name: name ?? email.split('@')[0],
        email,
        password: randomUUID(),
      });
      // Alguns services retornam `{ message, user }`, outros retornam `User`
      user = (created as any)?.user ?? (created as any);      
    }
  
    
    if (!user) {
      return res.redirect(this.getFrontendUrl() + '/login/callback?error=user_creation_failed');
    }

    // 3) Gera JWT usando método existente e síncrono
    const token = await this.authService.generateToken({
      id: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
    });

    // Add defensive header to avoid caching issues
    res.setHeader('Cache-Control', 'no-store');
    
    // 4) Seta cookie HttpOnly (útil para chamadas futuras do SPA)
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
  

    // 5) Redireciona para o frontend com ?token=
    return res.redirect(
      `${this.getFrontendUrl()}/login/callback?token=${encodeURIComponent(token)}`,
    );
  }


  // ========================
  // Helpers
  // ========================
  private getFrontendUrl(): string {
    return (
      this.configService.get<string>('FRONTEND_URL') ??
      process.env.FRONTEND_URL ??
      'http://localhost:4400'
    );
  }
}
