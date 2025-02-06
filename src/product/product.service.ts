import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Categorys, Orders, Products } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  getProducts = async (params: {
    category: string | null;
    priceMin: number;
    priceMax: number;
    offset: number;
    limit: number;
  }): Promise<{
    state: string;
    message: string;
    data: Products[];
  }> => {
    const { category, priceMin, priceMax, offset, limit } = params;

    if (priceMin < 0 || priceMax < 0) {
      throw new HttpException(
        {
          state: 'error',
          message: 'Invalid query parameters.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (priceMin > priceMax) {
      throw new HttpException(
        {
          state: 'error',
          message: 'Invalid query parameters.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    if ((offset !== null && offset < 0) || (limit !== null && limit < 0)) {
      throw new HttpException(
        {
          state: 'error',
          message: 'Invalid query parameters.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (category) {
      const categoryDocument: Categorys | null =
        await this.prisma.categorys.findUnique({
          where: {
            id: category,
          },
        });

      if (!categoryDocument) {
        throw new HttpException(
          {
            state: 'error',
            message: 'Category not found.',
          },
          HttpStatus.NOT_FOUND,
        );
      }
    }

    try {
      const products: Products[] | [] = await this.prisma.products.findMany({
        where: {
          categoryId: category ?? undefined,
          price: {
            gte: Number(priceMin),
            lte: Number(priceMax),
          },
        },
        skip: Number(offset),
        take: Number(limit),
        orderBy: { price: 'asc' },
      });

      return {
        state: 'success',
        message: `${products.length} products found.`,
        data: products,
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

  getProduct = async (
    productId: string,
  ): Promise<{
    state: string;
    message: string;
    data: Products;
  }> => {
    const product: Products | null = await this.prisma.products.findUnique({
      where: {
        id: productId,
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

    return {
      state: 'success',
      message: 'Product found.',
      data: product,
    };
  };

  getOrders = async (params: {
    sortByDate: boolean;
    offset: number;
    limit: number;
  }): Promise<{
    state: string;
    message: string;
    data: Orders[];
  }> => {
    const { sortByDate, offset, limit } = params;

    if (Boolean(sortByDate) !== true || false) {
      throw new HttpException(
        {
          state: 'error',
          message: 'Inavlid query parameters.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (Number(offset) <= 0 && Number(limit) <= 0) {
      throw new HttpException(
        {
          state: 'error',
          message: 'Inavlid query parameters.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const orders: Orders[] | [] = await this.prisma.orders.findMany({
        skip: Number(offset),
        take: Number(limit),
        orderBy: {
          createdAt: 'asc',
        },
      });

      return {
        state: 'success',
        message: `${orders.length} orders found.`,
        data: orders,
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
