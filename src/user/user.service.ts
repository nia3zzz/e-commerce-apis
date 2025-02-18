import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  CartItems,
  Carts,
  OrderItems,
  Orders,
  Sessions,
  Users,
} from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  createUserZod,
  loginUserZod,
  updateProfilePictureZod,
} from './user.zod';
import { AuthService } from 'src/auth/auth.service';
import { decode } from 'jsonwebtoken';
import cloudinary from 'src/cloudinary/cloudinary';
import { UploadApiResponse } from 'cloudinary';

export interface IProfileData {
  firstName: string;
  lastName: string;
  userName: string;
  profileImageUrl: string;
  numberOfProductsInCarts: number;
  productsInCarts: CartItems[];
  numberOfProductsPendingOrder: number;
  productsPendingOrder: OrderItems[];
}

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  createUser = async (
    data: typeof createUserZod,
  ): Promise<{
    state: string;
    message: string;
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
      const hashedPassword: string = await this.authService.hashPassword(
        validateData.data.password,
      );

      await this.prisma.users.create({
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

  login = async (data: typeof loginUserZod): Promise<string> => {
    const validateData = loginUserZod.safeParse(data);

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

    let user: Users | null = null;

    if (validateData.data.email) {
      user = await this.prisma.users.findUnique({
        where: {
          email: validateData.data.email,
        },
      });
    } else if (validateData.data.userName) {
      user = await this.prisma.users.findUnique({
        where: { userName: validateData.data.userName },
      });
    }

    if (!user) {
      throw new HttpException(
        {
          state: 'error',
          message: 'Invalid Credentials.',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    const isMatchedPassword: boolean = await this.authService.verifyPassword(
      validateData.data.password,
      user.password,
    );

    if (!isMatchedPassword) {
      throw new HttpException(
        {
          state: 'error',
          message: 'Invalid Credentials.',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    try {
      const token: Promise<string> = this.authService.generateToken(user.id);

      return token;
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

  logout = async (
    token: string,
  ): Promise<{
    state: string;
    message: string;
  }> => {
    const decoded: any = decode(token);

    const userId: string = decoded.id;

    const foundSession: Sessions | null = await this.prisma.sessions.findFirst({
      where: {
        userId: userId,
      },
    });

    try {
      await this.prisma.sessions.delete({
        where: {
          id: foundSession?.id,
        },
      });

      return {
        state: 'success',
        message: 'Logout successful.',
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

  updateProfilePicture = async (
    data: typeof updateProfilePictureZod,
    token: string,
  ): Promise<{
    state: string;
    message: string;
    data: {
      profileImageUrl: string;
    };
  }> => {
    const validateData = updateProfilePictureZod.safeParse(data);

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

    try {
      const decoded: any = decode(token);

      const userId: string = decoded.id;

      const profileSecureUrl: UploadApiResponse =
        await cloudinary.uploader.upload(validateData.data.file.path, {
          folder: 'products',
        });

      const userUpdatedDocument: Users = await this.prisma.users.update({
        where: {
          id: userId,
        },
        data: {
          profileImageUrl: profileSecureUrl.secure_url,
        },
      });

      return {
        state: 'success',
        message: 'Profile picture has been updated.',
        data: {
          profileImageUrl: userUpdatedDocument.profileImageUrl,
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

  removeProfilePicture = async (
    token: string,
  ): Promise<{
    state: string;
    message: string;
    data: {
      profileImageUrl: string;
    };
  }> => {
    const decoded: any = decode(token);

    const userId: string = decoded.id;

    const foundUser: Users | null = await this.prisma.users.findUnique({
      where: {
        id: userId,
      },
    });

    if (
      foundUser?.profileImageUrl ===
      'https://i.pinimg.com/280x280_RS/e1/08/21/e10821c74b533d465ba888ea66daa30f.jpg'
    ) {
      throw new HttpException(
        {
          state: 'error',
          message: 'No profile picture to remove.',
        },
        HttpStatus.CONFLICT,
      );
    }

    try {
      const updateUserDocument = await this.prisma.users.update({
        where: {
          id: userId,
        },
        data: {
          profileImageUrl:
            'https://i.pinimg.com/280x280_RS/e1/08/21/e10821c74b533d465ba888ea66daa30f.jpg',
        },
      });

      return {
        state: 'success',
        message: 'Profile picture has been removed.',
        data: {
          profileImageUrl: updateUserDocument.profileImageUrl,
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

  getProfile = async (
    token: string,
  ): Promise<{
    state: string;
    message: string;
    data: IProfileData;
  }> => {
    const decoded: any = decode(token);

    const userId: string = decoded.id;

    try {
      const foundUser: Users | null = await this.prisma.users.findUnique({
        where: {
          id: userId,
        },
      });

      const cart: Carts | null = await this.prisma.carts.findFirst({
        where: {
          userId: foundUser?.id,
        },
      });

      const cartItems: CartItems[] | [] = await this.prisma.cartItems.findMany({
        where: {
          cartId: cart?.id,
        },
      });

      const orders: Orders[] | [] = await this.prisma.orders.findMany({
        where: {
          userId: userId,
        },
      });

      const orderItems: OrderItems[] | [] = await Promise.all(
        orders.map(async (order) => {
          const orderItem: OrderItems | null =
            await this.prisma.orderItems.findFirst({
              where: {
                orderId: order.id,
                status: 'PENDING',
              },
            });
          return orderItem;
        }),
      ).then(
        (orderItems) =>
          orderItems.filter((item) => item !== null) as OrderItems[],
      );

      return {
        state: 'success',
        message: 'Profile data has been fetched.',
        data: {
          firstName: foundUser?.firstName ?? '',
          lastName: foundUser?.lastName ?? '',
          userName: foundUser?.userName ?? '',
          profileImageUrl: foundUser?.profileImageUrl ?? '',
          numberOfProductsInCarts: cartItems.length,
          productsInCarts: cartItems,
          numberOfProductsPendingOrder: orderItems.length,
          productsPendingOrder: orderItems,
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
}
