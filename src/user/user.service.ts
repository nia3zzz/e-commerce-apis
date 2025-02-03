import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Sessions, Users } from '@prisma/client';
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
import { string } from 'zod';

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
      const hashedPassword: string = await this.authService.hashPassword(
        validateData.data.password,
      );

      const user: Users = await this.prisma.users.create({
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

  logout = async (token: string): Promise<boolean> => {
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

      return true;
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
    data: Users;
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
        data: userUpdatedDocument,
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
    data: Users;
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
        data: updateUserDocument,
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
