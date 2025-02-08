import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AddressService } from './address.service';
import { createAddressZod } from './address.zod';
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
}
