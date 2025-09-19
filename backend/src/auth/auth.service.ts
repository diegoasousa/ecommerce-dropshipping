import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/user.entity';
import { RegisterDto } from './dto/register.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(User) private userRepository: Repository<User>
  ) {}

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async generateToken(payload: { id: number; role: string; name?: string; email?: string }) {
    const secret = this.configService.get<string>('JWT_SECRET');
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '7d';
    
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }
    
    return this.jwtService.sign(payload, { secret, expiresIn });
  }

  async register(registerDto: RegisterDto, role: UserRole = 'user') {
    const hashedPassword = await this.hashPassword(registerDto.password);
    const user = this.userRepository.create({ ...registerDto, password: hashedPassword, role });
    await this.userRepository.save(user);
    return { message: 'User registered successfully', user };
  }
}
