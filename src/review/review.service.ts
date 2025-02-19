import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { createReviewZod } from './review.zod';
import { decode } from 'jsonwebtoken';
import { OrderItems, Orders, Reviews } from '@prisma/client';

export interface IReviewData {
  id: string;
  productId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

@Injectable()
export class ReviewService {
  constructor(private readonly prisma: PrismaService) {}

  addReview = async (
    data: typeof createReviewZod,
    token: string,
  ): Promise<{
    state: string;
    message: string;
    data: IReviewData;
  }> => {
    const validateData = createReviewZod.safeParse(data);

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

    //check if user has orderd this product
    const foundOrderItem: OrderItems | null =
      await this.prisma.orderItems.findUnique({
        where: {
          id: validateData.data.orderItemId,
        },
      });

    if (!foundOrderItem) {
      throw new HttpException(
        {
          state: 'error',
          message: 'Product not found.',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    const foundOrder: Orders | null = await this.prisma.orders.findUnique({
      where: {
        id: foundOrderItem.orderId,
      },
    });

    if (
      foundOrderItem?.status !== 'COMPLETED' ||
      foundOrder?.userId !== userId
    ) {
      throw new HttpException(
        {
          state: 'error',
          message: 'You can not review this product.',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    try {
      const review: Reviews | null = await this.prisma.reviews.create({
        data: {
          orderItemId: validateData.data.orderItemId,
          userId: userId,
          rating: validateData.data.rating,
          comment: validateData.data.comment,
        },
      });

      return {
        state: 'success',
        message: 'Your review has been added.',
        data: {
          id: review.id,
          productId: foundOrderItem.productId,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
        },
      };
    } catch (error) {
      console.log(error);

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
