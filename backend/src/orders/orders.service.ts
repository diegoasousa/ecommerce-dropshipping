import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { User } from '../users/user.entity';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private orderRepository: Repository<Order>,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Product) private productRepository: Repository<Product>,
  ) {}

  async createOrder(createOrderDto: CreateOrderDto): Promise<Order> {
    const user = await this.userRepository.findOne({ where: { id: createOrderDto.userId } });
    if (!user) throw new Error('Usuário não encontrado');

    const products = await this.productRepository.findByIds(createOrderDto.products.map(p => p.id));
    const total = products.reduce((sum, product) => sum + product.price, 0);

    const order = this.orderRepository.create({ user, products, total });
    return await this.orderRepository.save(order);
  }

  async getOrdersByUser(userId: number): Promise<Order[]> {
    return await this.orderRepository.find({ where: { user: { id: userId } }, relations: ['user', 'products'] });
  }

  async updateOrderStatus(orderId: number, status: string): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (!order) throw new Error('Pedido não encontrado');
    order.status = status;
    return await this.orderRepository.save(order);
  }
}