import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { createCategoryZod, updateCategoryZod } from './admin.zod';
import { Categorys } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  createCategory = async (
    data: typeof createCategoryZod,
  ): Promise<{
    state: string;
    message: string;
    data: Categorys;
  }> => {
    const validateData = createCategoryZod.safeParse(data);

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

    const foundCategory: Categorys | null =
      await this.prisma.categorys.findFirst({
        where: {
          name: validateData.data.name,
        },
      });

    if (foundCategory) {
      throw new HttpException(
        {
          state: 'error',
          message: 'Category with this name already exists.',
        },
        HttpStatus.CONFLICT,
      );
    }

    try {
      const category = await this.prisma.categorys.create({
        data: {
          name: validateData.data.name,
          description: validateData.data.description,
        },
      });

      return {
        state: 'success',
        message: 'Category has been added.',
        data: category,
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

  getCategories = async (): Promise<{
    state: string;
    message: string;
    data: Categorys[];
  }> => {
    try {
      const categories: Categorys[] = await this.prisma.categorys.findMany();

      return {
        state: 'success',
        message: 'Data has been found.',
        data: categories,
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

  updateCategory = async (
    data: typeof updateCategoryZod,
    categoryId: string,
  ) => {
    const validateData = updateCategoryZod.safeParse(data);

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

    const category: Categorys | null = await this.prisma.categorys.findUnique({
      where: {
        id: categoryId,
      },
    });

    if (!category?.id) {
      throw new HttpException(
        {
          state: 'error',
          message: 'Category not found.',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    if (
      category.name === validateData.data.name &&
      category.totalProducts === validateData.data.totalProducts
    ) {
      throw new HttpException(
        {
          state: 'error',
          message: 'No changes found to update.',
        },
        HttpStatus.CONFLICT,
      );
    }

    try {
      const updatedCategory: Categorys = await this.prisma.categorys.update({
        where: {
          id: categoryId,
        },
        data: {
          name: validateData.data.name,
          totalProducts: validateData.data.totalProducts,
        },
      });

      return {
        state: 'success',
        message: 'Category has been updated.',
        data: updatedCategory,
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
