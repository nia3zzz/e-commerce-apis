import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { createAddressZod, updateAddressZod } from './address.zod';
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

  getAddress = async (
    token: string,
  ): Promise<{ state: string; message: string; data: Address }> => {
    const decoded: any = decode(token);
    const userId: string = decoded.id;

    const userAddressDocument: Address | null =
      await this.prisma.address.findFirst({
        where: {
          userId: userId,
        },
      });

    if (!userAddressDocument) {
      throw new HttpException(
        {
          state: 'error',
          message: 'No address found.',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      state: 'success',
      message: 'Address fetched successfully.',
      data: userAddressDocument,
    };
  };

  updateAddress = async (
    data: typeof updateAddressZod,
    token: string,
  ): Promise<{
    state: string;
    message: string;
    data: Address;
  }> => {
    const decoded: any = decode(token);
    const userId: string = decoded.id;

    const validateData = updateAddressZod.safeParse(data);

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

    const userAddressDocument: Address | null =
      await this.prisma.address.findFirst({
        where: {
          userId: userId,
        },
      });

    if (!userAddressDocument) {
      throw new HttpException(
        {
          state: 'error',
          message: 'No address found.',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    if (
      userAddressDocument.street === validateData.data.street &&
      userAddressDocument.city === validateData.data.city &&
      userAddressDocument.state === validateData.data.state &&
      userAddressDocument.postalCode === validateData.data.postalCode &&
      userAddressDocument.country === validateData.data.country
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
      const updateUserAddressDocument: Address | null =
        await this.prisma.address.update({
          where: {
            id: userAddressDocument.id,
          },
          data: {
            street: validateData.data.street,
            city: validateData.data.city,
            state: validateData.data.state,
            postalCode: validateData.data.postalCode,
            country: validateData.data.country,
          },
        });

      return {
        state: 'success',
        message: 'Address updated successfully.',
        data: updateUserAddressDocument,
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

  deleteAddress = async (
    token: string,
  ): Promise<{
    state: string;
    message: string;
  }> => {
    const decoded: any = decode(token);
    const userId: string = decoded.id;

    const foundUserAddress: Address | null =
      await this.prisma.address.findFirst({
        where: {
          userId: userId,
        },
      });

    if (!foundUserAddress) {
      throw new HttpException(
        {
          state: 'error',
          message: 'No address found to delete.',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    try {
      await this.prisma.address.delete({
        where: {
          id: foundUserAddress.id,
        },
      });

      return {
        state: 'success',
        message: 'Address has been deleted.',
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
