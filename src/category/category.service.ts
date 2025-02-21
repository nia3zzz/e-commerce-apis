import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Categorys } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

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
}
