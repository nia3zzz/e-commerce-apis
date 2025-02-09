import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AddressService } from './address.service';
import { createAddressZod, updateAddressZod } from './address.zod';
import { Request } from 'express';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('address')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @UseGuards(AuthGuard)
  @Post()
  createAddress(@Req() req: Request, @Body() data: typeof createAddressZod) {
    return this.addressService.createAddress(data, req.cookies.token as string);
  }

  @UseGuards(AuthGuard)
  @Get()
  getAddress(@Req() req: Request) {
    return this.addressService.getAddress(req.cookies.token as string);
  }

  @UseGuards(AuthGuard)
  @Put()
  updateAddress(@Req() req: Request, @Body() data: typeof updateAddressZod) {
    return this.addressService.updateAddress(data, req.cookies.token as string);
  }

  @UseGuards(AuthGuard)
  @Delete()
  deleteAddress(@Req() req: Request) {
    return this.addressService.deleteAddress(req.cookies.token as string);
  }
}
