import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  addProductToCartZod,
  removeCartItemZod,
  updateCartItemsZod,
} from './cart.zod';
import { decode } from 'jsonwebtoken';
import { CartItems, Carts, Categorys, Products } from '@prisma/client';

export interface ICartItem {
  id: string;
  product: {
    id: string;
    name: string;
    productPrice: number;
    categoryName: string;
    stock: number;
    imagesUrl: string[];
  };
  quantity: number;
  price: number;
  createdAt: Date;
}

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  addProductToCart = async (
    data: typeof addProductToCartZod,
    token: string,
  ): Promise<{
    state: string;
    message: string;
    data: ICartItem;
  }> => {
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

    const foundCategory: Categorys | null =
      await this.prisma.categorys.findUnique({
        where: {
          id: foundProduct.categoryId,
        },
      });

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
        data: {
          id: cartItem.id,
          product: {
            id: foundProduct.id,
            name: foundProduct.name,
            productPrice: foundProduct.price,
            categoryName: foundCategory?.name ?? '',
            stock: foundProduct.stock,
            imagesUrl: foundProduct.imagesUrl,
          },
          quantity: cartItem.quantity,
          price: cartItem.price,
          createdAt: cartItem.createdAt,
        },
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
  ): Promise<{ state: string; message: string; data?: ICartItem[] }> => {
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
      data: await Promise.all(
        cartItems.map(async (cartItem) => {
          const foundProduct: Products | null =
            await this.prisma.products.findUnique({
              where: {
                id: cartItem.productId,
              },
            });

          const foundCategory: Categorys | null =
            await this.prisma.categorys.findUnique({
              where: {
                id: foundProduct?.categoryId,
              },
            });

          return {
            id: cartItem.id,
            product: {
              id: foundProduct?.id ?? '',
              name: foundProduct?.name ?? '',
              productPrice: foundProduct?.price ?? 0,
              categoryName: foundCategory?.name ?? '',
              stock: foundProduct?.stock ?? 0,
              imagesUrl: foundProduct?.imagesUrl ?? [],
            },
            quantity: cartItem.quantity,
            price: cartItem.price,
            createdAt: cartItem.createdAt,
          };
        }),
      ),
    };
  };

  updateCartItem = async (
    data: typeof updateCartItemsZod,
  ): Promise<{
    state: string;
    message: string;
    data: ICartItem;
  }> => {
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

      const foundCategory: Categorys | null =
        await this.prisma.categorys.findUnique({
          where: { id: product.categoryId },
        });

      return {
        state: 'success',
        message: 'Cart item updated.',
        data: {
          id: updatedCartItem.id,
          product: {
            id: product.id,
            name: product.name,
            productPrice: product.price,
            categoryName: foundCategory?.name ?? '',
            stock: product.stock,
            imagesUrl: product.imagesUrl,
          },
          quantity: updatedCartItem.quantity,
          price: updatedCartItem.price,
          createdAt: updatedCartItem.createdAt,
        },
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

  removeCartItem = async (
    data: typeof removeCartItemZod,
  ): Promise<{
    state: string;
    message: string;
  }> => {
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
