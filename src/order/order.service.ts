import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { cancelOrderZod, placeOrderZod } from './order.zod';
import { decode } from 'jsonwebtoken';
import { PrismaService } from 'src/prisma/prisma.service';
import { Address, OrderItems, Orders, Products } from '@prisma/client';

export interface IPlaceOrderResult {
  orderId: string;
  productName: string;
  quantity: number;
  paymentMethod: 'COD' | 'ONLINE';
  price: number;
}

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  placeOrder = async (
    data: typeof placeOrderZod,
    token: string,
  ): Promise<{
    state: string;
    message: string;
    data: IPlaceOrderResult;
  }> => {
    const decoded: any = decode(token);
    const userId: string = decoded.id;

    const validateData = placeOrderZod.safeParse(data);

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

    const checkProductExists: Products | null =
      await this.prisma.products.findUnique({
        where: {
          id: validateData.data.productId,
        },
      });

    if (!checkProductExists) {
      throw new HttpException(
        {
          state: 'error',
          message: 'Product not found.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const checkUserAddressExists: Address | null =
      await this.prisma.address.findFirst({
        where: {
          userId: userId,
        },
      });

    if (!checkUserAddressExists) {
      throw new HttpException(
        {
          state: 'error',
          message: 'Address not found.',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    if (validateData.data.quantity > checkProductExists.stock) {
      throw new HttpException(
        {
          state: 'error',
          message: `Only ${checkProductExists.stock} items are available.`,
        },
        HttpStatus.CONFLICT,
      );
    }

    try {
      const price = checkProductExists.price * validateData.data.quantity;

      let userOrder: Orders | null = null;

      userOrder = await this.prisma.orders.findFirst({
        where: {
          userId: userId,
        },
      });

      if (!userOrder) {
        userOrder = await this.prisma.orders.create({
          data: {
            userId: userId,
          },
        });
      }

      const orderItem: OrderItems = await this.prisma.orderItems.create({
        data: {
          orderId: userOrder.id,
          productId: validateData.data.productId,
          quantity: validateData.data.quantity,
          shippingAddressId: checkUserAddressExists.id,
          paymentMethod: validateData.data.paymentMethod,
          price: price,
        },
      });

      await this.prisma.products.update({
        where: {
          id: validateData.data.productId,
        },
        data: {
          stock: {
            decrement: validateData.data.quantity,
          },
        },
      });

      return {
        state: 'success',
        message: 'Order placed successfully.',
        data: {
          orderId: orderItem.id,
          productName: checkProductExists.name,
          quantity: validateData.data.quantity,
          paymentMethod: validateData.data.paymentMethod,
          price: price,
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

  cancelOrder = async (
    data: typeof cancelOrderZod,
    token: string,
  ): Promise<{
    state: string;
    message: string;
  }> => {
    const decoded: any = decode(token);
    const userId: string = decoded.id;

    const validateData = cancelOrderZod.safeParse(data);

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

    const foundOrderItem: OrderItems | null =
      await this.prisma.orderItems.findUnique({
        where: {
          id: validateData.data.orderId,
        },
      });

    if (!foundOrderItem) {
      throw new HttpException(
        {
          state: 'error',
          message: 'Order not found.',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    //check if user is the owner of the order
    const foundOrder: Orders | null = await this.prisma.orders.findUnique({
      where: {
        id: foundOrderItem.orderId,
      },
    });

    if (foundOrder?.userId !== userId) {
      throw new HttpException(
        {
          state: 'error',
          message: 'Unauthorized.',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (foundOrderItem.status !== 'PENDING') {
      throw new HttpException(
        {
          state: 'error',
          message: 'Cancel the order at your delivery location.',
        },
        HttpStatus.CONFLICT,
      );
    }

    try {
      await this.prisma.orderItems.delete({
        where: {
          id: validateData.data.orderId,
        },
      });

      await this.prisma.products.update({
        where: {
          id: foundOrderItem.productId,
        },
        data: {
          stock: {
            increment: foundOrderItem.quantity,
          },
        },
      });

      return {
        state: 'success',
        message: 'Order cancelled successfully.',
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
