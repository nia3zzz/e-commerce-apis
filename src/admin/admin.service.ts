import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  createCategoryZod,
  createProductZod,
  updateCategoryZod,
  updateProductZod,
} from './admin.zod';
import { Categorys, Products } from '@prisma/client';
import { z } from 'zod';
import cloudinary from 'src/cloudinary/cloudinary';

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
  ): Promise<{
    state: string;
    message: string;
    data: Categorys;
  }> => {
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

  deleteCategory = async (
    categoryId: string,
  ): Promise<{
    state: string;
    message: string;
  }> => {
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

    try {
      await this.prisma.products.deleteMany({
        where: {
          categoryId: categoryId,
        },
      });

      await this.prisma.categorys.delete({
        where: {
          id: categoryId,
        },
      });

      return {
        state: 'success',
        message: 'Category has been deleted.',
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

  createProduct = async (
    data: z.infer<typeof createProductZod>,
  ): Promise<{
    state: string;
    message: string;
    data: Products;
  }> => {
    const validateData = createProductZod.safeParse({
      name: data.name,
      description: data.description,
      price: data.price,
      files: Array.isArray(data.files) ? data.files : [data.files],
      categoryId: data.categoryId,
      stock: data.stock,
    });

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
        id: validateData.data.categoryId,
      },
    });

    if (!category) {
      throw new HttpException(
        {
          state: 'error  ',
          message: 'Category not found.',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    try {
      const imageUrls: string[] = await Promise.all(
        validateData.data.files.map(async (file) => {
          const imageUrl = await cloudinary.uploader.upload(file.path, {
            folder: 'products',
          });
          return imageUrl.secure_url;
        }),
      );

      const product: Products | null = await this.prisma.products.create({
        data: {
          name: validateData.data.name,
          description: validateData.data.description,
          price: validateData.data.price,
          imagesUrl: imageUrls,
          categoryId: validateData.data.categoryId,
          stock: validateData.data.stock,
        },
      });

      await this.prisma.categorys.update({
        where: {
          id: validateData.data.categoryId,
        },
        data: {
          totalProducts: category.totalProducts + 1,
        },
      });

      return {
        state: 'success',
        message: 'Product has been added.',
        data: product,
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

  updateProduct = async (
    data: z.infer<typeof updateProductZod>,
    productId: string,
  ): Promise<{
    state: string;
    message: string;
    data: Products;
  }> => {
    const validateData = updateProductZod.safeParse({
      name: data.name,
      description: data.description,
      price: data.price,
      categoryId: data.categoryId,
      stock: data.stock,
    });

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

    const category: Categorys | null = await this.prisma.categorys.findUnique({
      where: {
        id: validateData.data.categoryId,
      },
    });

    if (!category) {
      throw new HttpException(
        {
          state: 'error',
          message: 'Category not found.',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    if (
      product.name === validateData.data.name &&
      product.description === validateData.data.description &&
      product.price === validateData.data.price &&
      product.categoryId === validateData.data.categoryId &&
      product.stock === validateData.data.stock
    ) {
      throw new HttpException(
        {
          state: 'error',
          message: 'No changes detected.',
        },
        HttpStatus.CONFLICT,
      );
    }

    try {
      const updateProduct: Products = await this.prisma.products.update({
        where: {
          id: productId,
        },
        data: {
          name: validateData.data.name,
          description: validateData.data.description,
          price: validateData.data.price,
          categoryId: validateData.data.categoryId,
          stock: validateData.data.stock,
        },
      });

      if (updateProduct.categoryId !== product.categoryId) {
        const previousCategory: Categorys | null =
          await this.prisma.categorys.findUnique({
            where: {
              id: product.categoryId,
            },
          });

        await this.prisma.categorys.update({
          where: {
            id: previousCategory?.id,
          },
          data: {
            totalProducts: category.totalProducts - 1,
          },
        });

        await this.prisma.categorys.update({
          where: {
            id: updateProduct.categoryId,
          },
          data: {
            totalProducts: category.totalProducts + 1,
          },
        });
      }

      return {
        state: 'success',
        message: 'Product has been updated.',
        data: updateProduct,
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

  deleteProduct = async (
    productId: string,
  ): Promise<{
    state: string;
    message: string;
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

    try {
      const category: Categorys | null = await this.prisma.categorys.findUnique(
        {
          where: {
            id: product.categoryId,
          },
        },
      );

      if (category) {
        await this.prisma.categorys.update({
          where: {
            id: category?.id,
          },
          data: {
            totalProducts: category.totalProducts - 1,
          },
        });
      }

      await this.prisma.products.delete({
        where: {
          id: productId,
        },
      });

      return {
        state: 'success',
        message: 'Product has been deleted.',
      };
    } catch {
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
