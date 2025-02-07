import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  addProductToCartZod,
  removeCartItemZod,
  updateCartItemsZod,
} from './cart.zod';
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

    const cartItemExists: CartItems | null =
      await this.prisma.cartItems.findFirst({
        where: {
          cartId: foundCart.id,
          productId: validateData.data.productId,
        },
      });

    if (cartItemExists) {
      throw new HttpException(
        {
          state: 'error',
          message: 'Product already exists in cart.',
        },
        HttpStatus.CONFLICT,
      );
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

  getCartItems = async (
    token: string,
  ): Promise<{ state: string; message: string; data?: CartItems[] }> => {
    const decoded: any = decode(token);
    const userId: string = decoded?.id;

    const userCart: Carts | null = await this.prisma.carts.findFirst({
      where: {
        userId: userId,
      },
    });

    if (!userCart) {
      return {
        state: 'success',
        message: 'No products found in cart.',
      };
    }

    const cartItems: CartItems[] = await this.prisma.cartItems.findMany({
      where: {
        cartId: userCart.id,
      },
    });

    return {
      state: 'success',
      message: 'Products found in cart.',
      data: cartItems,
    };
  };

  updateCartItem = async (data: typeof updateCartItemsZod) => {
    const validateData = updateCartItemsZod.safeParse(data);

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

    const foundCartItem: CartItems | null =
      await this.prisma.cartItems.findFirst({
        where: {
          id: validateData.data.productInCartId,
        },
      });

    if (!foundCartItem) {
      throw new HttpException(
        {
          state: 'error',
          message: 'Product not found.',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    const product: Products | null = await this.prisma.products.findUnique({
      where: {
        id: foundCartItem.productId,
      },
    });

    if (!product) {
      throw new HttpException(
        {
          state: 'error',
          message: 'Product not found.',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    const price = product.price * validateData.data.quantity;
    try {
      const updatedCartItem: CartItems = await this.prisma.cartItems.update({
        where: {
          id: validateData.data.productInCartId,
        },
        data: {
          quantity: validateData.data.quantity,
          price: price,
        },
      });

      return {
        state: 'success',
        message: 'Cart item updated.',
        data: updatedCartItem,
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

  removeCartItem = async (data: typeof removeCartItemZod) => {
    const validateData = removeCartItemZod.safeParse(data);

    if (!validateData.success) {
      throw new HttpException(
        {
          state: 'error',
          message: 'Failed in type validation.',
          error: validateData.error.errors[0].message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const foundCartItem: CartItems | null =
      await this.prisma.cartItems.findFirst({
        where: {
          id: validateData.data.productInCartId,
        },
      });

    if (!foundCartItem) {
      throw new HttpException(
        {
          state: 'error',
          message: 'Product not found.',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    const totalCartItems: CartItems[] | [] =
      await this.prisma.cartItems.findMany({
        where: {
          cartId: foundCartItem.cartId,
        },
      });

    try {
      if (totalCartItems.length === 1) {
        await this.prisma.cartItems.delete({
          where: {
            id: validateData.data.productInCartId,
          },
        });

        await this.prisma.carts.delete({
          where: {
            id: foundCartItem.cartId,
          },
        });
      } else {
        await this.prisma.cartItems.delete({
          where: {
            id: validateData.data.productInCartId,
          },
        });
      }

      return {
        state: 'success',
        message: 'Product removed from cart.',
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
