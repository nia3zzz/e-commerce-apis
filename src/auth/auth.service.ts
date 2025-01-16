import { Injectable } from '@nestjs/common';
import { sign, JwtPayload } from 'jsonwebtoken';
import { hash, genSalt, compare } from 'bcryptjs';

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

  constructor() {
    this.checkJwtSecret();
  }

  generateToken = (id: string): string => {
    const payload: Payload = { id };
    const token: string = sign(payload, this.jwtSecret, { expiresIn: '30d' });
    return token;
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
