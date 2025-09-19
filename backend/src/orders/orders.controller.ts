import { Controller, Get, UseGuards, Post, Patch, Body, Param, Req, Delete } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('orders')
export class OrdersController {
  constructor(private readonly orderService: OrdersService) {}
  @Get()
  getAllOrders() {
    return this.orderService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateOrderDto, @Req() req) {
    const user = req.user;
    return this.orderService.create(dto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getOrdersByUser(@Req() req) {
    return this.orderService.getOrdersByUser(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':orderId/status')
  async updateOrderStatus(@Param('orderId') orderId: number, @Body('status') status: string) {
    return this.orderService.updateOrderStatus(orderId, status);
  }


  @Delete(':orderId')
  async remove(@Param('orderId') orderId: number) {
    await this.orderService.remove(orderId);
    return { message: 'Pedido removido com sucesso' };
  }
}