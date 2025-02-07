import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AuthGuard } from 'src/auth/auth.guard';
import {
  addProductToCartZod,
  removeCartItemZod,
  updateCartItemsZod,
} from './cart.zod';
import { Request } from 'express';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @UseGuards(AuthGuard)
  @Post()
  addProductToCart(
    @Req() req: Request,
    @Body() data: typeof addProductToCartZod,
  ) {
    return this.cartService.addProductToCart(data, req.cookies.token as string);
  }

  @UseGuards(AuthGuard)
  @Get()
  getCartItems(@Req() req: Request) {
    return this.cartService.getCartItems(req.cookies.token as string);
  }

  @UseGuards(AuthGuard)
  @Put()
  updateCartItem(@Body() data: typeof updateCartItemsZod) {
    return this.cartService.updateCartItem(data);
  }

  @UseGuards(AuthGuard)
  @Delete()
  deleteCartItem(@Body() data: typeof removeCartItemZod) {
    return this.cartService.removeCartItem(data);
  }
}
