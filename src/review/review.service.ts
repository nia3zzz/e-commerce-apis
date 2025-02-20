import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { createReviewZod } from './review.zod';
import { decode } from 'jsonwebtoken';
import { OrderItems, Orders, Products, Reviews } from '@prisma/client';
import cloudinary from 'src/cloudinary/cloudinary';

export interface IReviewData {
  id: string;
  reviewImagesUrl: string[];
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

    if (
      Number(validateData.data.rating) < 1 ||
      Number(validateData.data.rating) > 5
    ) {
      throw new HttpException(
        {
          state: 'error',
          message: 'Failed in type validation.',
          errors: 'Rating must be between 1 and 5.',
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
      const imageUrls: string[] = await Promise.all(
        validateData.data.files.map(async (file) => {
          const imageUrl = await cloudinary.uploader.upload(file.path, {
            folder: 'reviews',
          });
          return imageUrl.secure_url;
        }),
      );

      const review: Reviews | null = await this.prisma.reviews.create({
        data: {
          orderItemId: validateData.data.orderItemId,
          productId: foundOrderItem.productId,
          userId: userId,
          reviewImagesUrl: imageUrls,
          rating: Number(validateData.data.rating),
          comment: validateData.data.comment,
        },
      });

      return {
        state: 'success',
        message: 'Your review has been added.',
        data: {
          id: review.id,
          reviewImagesUrl: review.reviewImagesUrl,
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

  getReviews = async (
    productId: string,
  ): Promise<{
    state: string;
    message: string;
    data: IReviewData[];
  }> => {
    const foundProduct: Products | null = await this.prisma.products.findUnique(
      {
        where: {
          id: productId,
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

    try {
      const reviews: Reviews[] | null = await this.prisma.reviews.findMany({
        where: {
          productId: foundProduct.id,
        },
      });

      return {
        state: 'success',
        message: 'Reviews found.',
        data: reviews.map((review) => {
          return {
            id: review.id,
            reviewImagesUrl: review.reviewImagesUrl,
            rating: review.rating,
            comment: review.comment,
            createdAt: review.createdAt,
          };
        }),
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

  deleteReview = async (
    reviewId: string,
    token: string,
  ): Promise<{
    state: string;
    message: string;
  }> => {
    const decoded: any = decode(token);
    const userId: string = decoded?.id;

    const foundReview: Reviews | null = await this.prisma.reviews.findUnique({
      where: {
        id: reviewId,
      },
    });

    if (!foundReview) {
      throw new HttpException(
        {
          state: 'error',
          message: 'Review not found.',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    if (foundReview.userId !== userId) {
      throw new HttpException(
        {
          state: 'error',
          message: 'You can not delete this review.',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    try {
      await this.prisma.reviews.delete({
        where: {
          id: reviewId,
        },
      });

      return {
        state: 'success',
        message: 'Review deleted.',
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
