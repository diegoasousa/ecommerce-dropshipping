import { Controller, Get, UseGuards, Post, Patch, Body, Param } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('orders')
export class OrdersController {
  constructor(private readonly orderService: OrdersService) {}
  @Get()
  @UseGuards(JwtAuthGuard)
  getAllOrders() {
    return { message: 'Lista de pedidos protegida acessada com sucesso!' };
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createOrder(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.createOrder(createOrderDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':userId')
  async getOrdersByUser(@Param('userId') userId: number) {
    return this.orderService.getOrdersByUser(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':orderId/status')
  async updateOrderStatus(@Param('orderId') orderId: number, @Body('status') status: string) {
    return this.orderService.updateOrderStatus(orderId, status);
  }
}