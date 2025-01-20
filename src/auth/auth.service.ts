import { Injectable } from '@nestjs/common';
import { sign, JwtPayload } from 'jsonwebtoken';
import { hash, genSalt, compare } from 'bcryptjs';
import { PrismaService } from 'src/prisma/prisma.service';
import { Sessions } from '@prisma/client';

interface Payload extends JwtPayload {
  id: string;
}

@Injectable()
export class AuthService {
  private readonly jwtSecret: string = process.env.JWT_SECRET as string;

  private checkJwtSecret() {
    if (!this.jwtSecret) {
      throw new Error('JWT_SECRET is not defined in .env file.');
    }
  }

  constructor(private prisma: PrismaService) {
    this.checkJwtSecret();
  }

  generateToken = async (id: string): Promise<string> => {
    const payload: Payload = { id };
    const token: string = sign(payload, this.jwtSecret, { expiresIn: '30d' });

    const findSession: Sessions | null = await this.prisma.sessions.findFirst({
      where: {
        userId: id,
      },
    });

    if (findSession) {
      await this.prisma.sessions.delete({
        where: {
          id: findSession.id,
        },
      });
    }

    const sessionDocument: Sessions = await this.prisma.sessions.create({
      data: {
        userId: id,
        token: token,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return sessionDocument.token;
  };

  hashPassword = async (password: string): Promise<string> => {
    const salt: string = await genSalt(8);
    const hashedPassword: string = await hash(password, salt);
    return hashedPassword;
  };

  verifyPassword = async (
    password: string,
    hashedPassword: string,
  ): Promise<boolean> => {
    return await compare(password, hashedPassword);
  };
}
