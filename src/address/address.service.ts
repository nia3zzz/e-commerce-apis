import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { createAddressZod } from './address.zod';
import { Address } from '@prisma/client';
import { decode } from 'jsonwebtoken';

@Injectable()
export class AddressService {
  constructor(private readonly prisma: PrismaService) {}

  createAddress = async (
    data: typeof createAddressZod,
    token: string,
  ): Promise<{
    state: string;
    message: string;
    data: Address;
  }> => {
    const decoded: any = decode(token);
    const userId: string = decoded.id;

    const validateData = createAddressZod.safeParse(data);

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

    const duplicateAddress: Address | null =
      await this.prisma.address.findFirst({
        where: {
          userId: userId,
        },
      });

    if (duplicateAddress) {
      throw new HttpException(
        {
          state: 'error',
          message:
            'Address already exists, remove current address to add another.',
        },
        HttpStatus.CONFLICT,
      );
    }

    try {
      const createAddress: Address = await this.prisma.address.create({
        data: {
          userId: userId,
          street: validateData.data.street,
          city: validateData.data.city,
          state: validateData.data.state,
          postalCode: validateData.data.postalCode,
          country: validateData.data.country,
        },
      });

      return {
        state: 'success',
        message: 'Address created successfully.',
        data: createAddress,
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
