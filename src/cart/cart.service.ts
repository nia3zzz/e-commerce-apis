import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { addProductToCartZod } from './cart.zod';
import { decode } from 'jsonwebtoken';
import { CartItems, Carts, Products } from '@prisma/client';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  addProductToCart = async (
    data: typeof addProductToCartZod,
    token: string,
  ): Promise<{ state: string; message: string; data: CartItems }> => {
    const validateData = addProductToCartZod.safeParse(data);

    if (!validateData.success) {
      throw new HttpException(
        {
          state: 'error',
          message: 'Failed in type validation.',
          errors: validateData.error.errors[0].message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const decoded: any = decode(token);
    const userId: string = decoded?.id;

    const foundProduct: Products | null = await this.prisma.products.findUnique(
      {
        where: {
          id: validateData.data.productId,
        },
      },
    );

    if (!foundProduct) {
      throw new HttpException(
        {
          state: 'error',
          message: 'Product not found.',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    let foundCart: Carts | null = await this.prisma.carts.findFirst({
      where: {
        userId: userId,
      },
    });

    if (!foundCart) {
      foundCart = await this.prisma.carts.create({
        data: {
          userId: userId,
        },
      });
    }

    const price: number = foundProduct.price * validateData.data.quantity;
    try {
      let cartItem: CartItems | null = null;

      if (foundCart) {
        cartItem = await this.prisma.cartItems.create({
          data: {
            cartId: foundCart.id,
            productId: validateData.data.productId,
            quantity: validateData.data.quantity,
            price: price,
          },
        });
      }

      if (!cartItem) {
        throw new HttpException(
          {
            state: 'error',
            message: 'Something went wrong.',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return {
        state: 'success',
        message: 'Product added to cart.',
        data: cartItem,
      };
    } catch (error) {
      throw new HttpException(
        {
          state: 'error',
          message: 'Something went wrong.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  };
}
