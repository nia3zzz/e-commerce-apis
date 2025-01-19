import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Users } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { createUserZod } from './user.zod';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  createUser = async (
    data: typeof createUserZod,
  ): Promise<{
    state: string;
    message: string;
    data: Users;
  }> => {
    const validateData = createUserZod.safeParse(data);

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

    const duplicateUserName: Users | null = await this.prisma.users.findUnique({
      where: {
        userName: validateData.data.userName,
      },
    });

    if (duplicateUserName) {
      throw new HttpException(
        {
          state: 'error',
          message: 'User name already exists.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const duplicateEmail: Users | null = await this.prisma.users.findUnique({
      where: {
        email: validateData.data.email,
      },
    });

    if (duplicateEmail) {
      throw new HttpException(
        {
          state: 'error',
          message: 'Email already exists.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(
        validateData.data.password,
        salt,
      );

      const user = await this.prisma.users.create({
        data: {
          firstName: validateData.data.firstName,
          lastName: validateData.data.lastName,
          userName: validateData.data.userName,
          email: validateData.data.email,
          password: hashedPassword,
        },
      });

      return {
        state: 'success',
        message: 'User has been created.',
        data: user,
      };
    } catch (error) {
      throw new HttpException(
        {
          state: 'error',
          message: 'Something went wrong',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  };
}
