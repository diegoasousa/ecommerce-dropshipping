import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from '../users/address.entity';
import { User } from '../users/user.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from './entities/order.entity';
import { Product } from 'src/products/entities/product.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private orderRepository: Repository<Order>,
    @InjectRepository(Address) private addressRepository: Repository<Address>,
    @InjectRepository(Product) private productRepository: Repository<Product>,
  ) {}

  async create(dto: CreateOrderDto, user: User) {
    const order = this.orderRepository.create({
      user,
      status: dto.status,
      items: []
    });

    // Create order items based on the DTO
    for (const item of dto.items) {
      const product = await this.productRepository.findOneBy({ id: item.productId });
      if (product) {
        order.items.push({
          product,
          quantity: item.quantity,
          selectedSize: item.selectedSize,
          selectedColor: item.selectedColor,
        } as any); // adaptar ao tipo OrderItem se necessário
      }
    }
    return this.orderRepository.save(order);
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


  async findAll(): Promise<Order[]> {
    return this.orderRepository.find({
      relations: ['user', 'products', 'address'],
      order: { id: 'DESC' }
    });
  }
  
  async remove(orderId: number): Promise<void> {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (!order) {
      throw new Error('Pedido não encontrado');
    }
    await this.orderRepository.remove(order);
  }
}