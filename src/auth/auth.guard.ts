import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import { decode } from 'jsonwebtoken';
import { Sessions, Users } from '@prisma/client';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();

    const token: string = request.cookies['token'];

    if (!token) {
      throw new HttpException(
        {
          state: 'error',
          message: 'Unauthorized',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    const decoded: any = decode(token);

    const userId: string = decoded?.id;

    const foundUser: Users | null = await this.prisma.users.findUnique({
      where: {
        id: userId,
      },
    });

    if (!foundUser) {
      throw new HttpException(
        {
          state: 'error',
          message: 'Unauthorized',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    const foundSession: Sessions | null = await this.prisma.sessions.findFirst({
      where: {
        userId: userId,
      },
    });

    if (!foundSession) {
      throw new HttpException(
        {
          state: 'error',
          message: 'Unauthorized',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (foundSession.isRevoked) {
      throw new HttpException(
        {
          state: 'error',
          message: 'Unauthorized',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (foundSession.expiresAt.getTime() < Date.now()) {
      throw new HttpException(
        {
          state: 'error',
          message: 'Unauthorized',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    return true;
  }
}
