import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/user.entity';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(User) private userRepository: Repository<User>
  ) {}

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async generateToken(user: { id: number; role: string }) {
    return this.jwtService.sign({ userId: user.id, role: user.role });
  }

  async register(registerDto: RegisterDto, role: UserRole = 'user') {
    const hashedPassword = await this.hashPassword(registerDto.password);
    const user = this.userRepository.create({ ...registerDto, password: hashedPassword, role });
    await this.userRepository.save(user);
    return { message: 'User registered successfully', user };
  }
}
