import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { addProductToCartZod } from './cart.zod';
import { Request } from 'express';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @UseGuards(AuthGuard)
  @Post()
  async addProductToCart(
    @Req() req: Request,
    @Body() data: typeof addProductToCartZod,
  ) {
    return this.cartService.addProductToCart(data, req.cookies.token as string);
  }
}
