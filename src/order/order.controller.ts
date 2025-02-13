import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { Request } from 'express';
import { placeOrderZod } from './order.zod';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @UseGuards(AuthGuard)
  @Post('/')
  placeOrder(@Req() req: Request, @Body() data: typeof placeOrderZod) {
    return this.orderService.placeOrder(data, req.cookies.token as string);
  }
}
