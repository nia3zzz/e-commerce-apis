import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  createCategoryZod,
  createProductZod,
  updateCategoryZod,
  updateOrderZod,
  updateProductZod,
} from './admin.zod';
import {
  Address,
  Categorys,
  OrderItems,
  Orders,
  Products,
  Users,
} from '@prisma/client';
import { z } from 'zod';
import cloudinary from 'src/cloudinary/cloudinary';
import { UploadApiResponse } from 'cloudinary';

//return type for create, update and get product routes
export interface IProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryName: string;
  stock: number;
  imagesUrl: string[];
  averageRating: number;
}

export interface IOrder {
  id: string;
  orderdByName: string;
  productName: string;
  quantity: number;
  status: 'PENDING' | 'COMPLETED';
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    date: Date;
  };
  paymentMethod: 'COD' | 'ONLINE';
  price: number;
}

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
        message: `${categories.length} categories found.`,
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
    data: IProduct;
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
          price: Number(validateData.data.price),
          imagesUrl: imageUrls,
          categoryId: validateData.data.categoryId,
          stock: Number(validateData.data.stock),
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
        data: {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          categoryName: category.name,
          stock: product.stock,
          imagesUrl: product.imagesUrl,
          averageRating: product.averageRating ?? 0,
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

  updateProduct = async (
    data: z.infer<typeof updateProductZod>,
    productId: string,
  ): Promise<{
    state: string;
    message: string;
    data: IProduct;
  }> => {
    const validateData = updateProductZod.safeParse({
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
      product.price === Number(validateData.data.price) &&
      product.categoryId === validateData.data.categoryId &&
      product.stock === Number(validateData.data.stock)
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
      //if theres any images

      if (validateData.data.files && validateData.data.files.length > 0) {
        const imageUrls: string[] = await Promise.all(
          validateData.data.files.map(async (file) => {
            const imageUrl: UploadApiResponse =
              await cloudinary.uploader.upload(file.path, {
                folder: 'products',
              });
            return imageUrl.secure_url;
          }),
        );

        const updateProduct: Products = await this.prisma.products.update({
          where: {
            id: productId,
          },
          data: {
            name: validateData.data.name,
            description: validateData.data.description,
            price: Number(validateData.data.price),
            imagesUrl: imageUrls,
            categoryId: validateData.data.categoryId,
            stock: Number(validateData.data.stock),
          },
        });

        if (updateProduct.categoryId !== product.categoryId) {
          const previousCategory: Categorys | null =
            await this.prisma.categorys.findUnique({
              where: {
                id: product.categoryId,
              },
            });

          if (previousCategory) {
            await this.prisma.categorys.update({
              where: {
                id: previousCategory?.id,
              },
              data: {
                totalProducts: previousCategory.totalProducts - 1,
              },
            });
          }

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
          data: {
            id: updateProduct.id,
            name: updateProduct.name,
            description: updateProduct.description,
            price: updateProduct.price,
            categoryName: category.name,
            stock: updateProduct.stock,
            imagesUrl: updateProduct.imagesUrl,
            averageRating: updateProduct.averageRating ?? 0,
          },
        };
      }

      const updateProduct: Products = await this.prisma.products.update({
        where: {
          id: productId,
        },
        data: {
          name: validateData.data.name,
          description: validateData.data.description,
          price: Number(validateData.data.price),
          categoryId: validateData.data.categoryId,
          stock: Number(validateData.data.stock),
        },
      });

      if (updateProduct.categoryId !== product.categoryId) {
        const previousCategory: Categorys | null =
          await this.prisma.categorys.findUnique({
            where: {
              id: product.categoryId,
            },
          });

        if (previousCategory) {
          await this.prisma.categorys.update({
            where: {
              id: previousCategory?.id,
            },
            data: {
              totalProducts: previousCategory.totalProducts - 1,
            },
          });
        }

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
        data: {
          id: updateProduct.id,
          name: updateProduct.name,
          description: updateProduct.description,
          price: updateProduct.price,
          categoryName: category.name,
          stock: updateProduct.stock,
          imagesUrl: updateProduct.imagesUrl,
          averageRating: updateProduct.averageRating ?? 0,
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

  getProducts = async (params: {
    category: string | null;
    priceMin: number;
    priceMax: number;
    offset: number;
    limit: number;
  }): Promise<{
    state: string;
    message: string;
    data: IProduct[];
  }> => {
    const { category, priceMin, priceMax, offset, limit } = params;

    //querry validation
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
        data: await Promise.all(
          products.map(async (product) => {
            const productCategory: Categorys | null =
              await this.prisma.categorys.findUnique({
                where: {
                  id: product.categoryId,
                },
              });

            return {
              id: product.id,
              name: product.name,
              description: product.description,
              price: product.price,
              categoryName: productCategory?.name ?? '',
              stock: product.stock,
              imagesUrl: product.imagesUrl,
              averageRating: product.averageRating ?? 0,
            };
          }),
        ),
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
    data: IProduct;
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

    const productCategory: Categorys | null =
      await this.prisma.categorys.findUnique({
        where: {
          id: product.categoryId,
        },
      });

    return {
      state: 'success',
      message: 'Product found.',
      data: {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        categoryName: productCategory?.name ?? '',
        stock: product.stock,
        imagesUrl: product.imagesUrl,
        averageRating: product.averageRating ?? 0,
      },
    };
  };

  getOrders = async (params: {
    sortByDate: boolean;
    offset: number;
    limit: number;
  }): Promise<{
    state: string;
    message: string;
    data: IOrder[];
  }> => {
    const { sortByDate, offset, limit } = params;

    //querry validation
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
      const orderItems: OrderItems[] | [] =
        await this.prisma.orderItems.findMany({
          skip: Number(offset),
          take: Number(limit),
          orderBy: {
            createdAt: 'asc',
          },
        });

      return {
        state: 'success',
        message: `${orderItems.length} orders found.`,
        data: await Promise.all(
          orderItems.map(async (order) => {
            const foundOrder: Orders | null =
              await this.prisma.orders.findUnique({
                where: {
                  id: order.orderId,
                },
              });

            const foundUser: Users | null = await this.prisma.users.findUnique({
              where: {
                id: foundOrder?.userId,
              },
            });

            const foundProduct: Products | null =
              await this.prisma.products.findUnique({
                where: {
                  id: order.productId,
                },
              });

            const foundAddress: Address | null =
              await this.prisma.address.findFirst({
                where: {
                  userId: foundUser?.id,
                },
              });

            return {
              id: order.id,
              orderdByName:
                `${foundUser?.firstName ?? ''} ${foundUser?.lastName ?? ''}`.trim(),
              productName: foundProduct?.name ?? '',
              quantity: order.quantity,
              status: order.status,
              shippingAddress: {
                street: foundAddress?.street ?? '',
                city: foundAddress?.city ?? '',
                state: foundAddress?.state ?? '',
                postalCode: foundAddress?.postalCode ?? '0',
                country: foundAddress?.country ?? '',
                date: order.createdAt,
              },
              paymentMethod: order.paymentMethod,
              price: order.price,
            };
          }),
        ),
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

  getOrder = async (orderId: string) => {
    const category: Categorys | null = await this.prisma.categorys.findUnique({
      where: {
        id: orderId,
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

    return category;
  };

  updateOrder = async (data: typeof updateOrderZod, orderId: string) => {
    const validateData = updateOrderZod.safeParse(data);

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

    const order: Orders | null = await this.prisma.orders.findUnique({
      where: {
        id: orderId,
      },
    });

    if (!order) {
      throw new HttpException(
        {
          state: 'error',
          message: 'Order not found.',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    try {
      const updatedOrderDocument: OrderItems | null =
        await this.prisma.orderItems.update({
          where: {
            id: orderId,
          },
          data: {
            status: validateData.data.status,
          },
        });

      return {
        state: 'success',
        message: 'Order updated.',
        data: updatedOrderDocument,
      };
    } catch (error) {
      throw new HttpException(
        {
          state: 'error',
          message: 'Internal server error.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  };
}
