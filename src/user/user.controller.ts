import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { createUserZod, loginUserZod } from './user.zod';
import { Request, Response } from 'express';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/')
  createUser(@Body() data: typeof createUserZod) {
    return this.userService.createUser(data);
  }

  @Post('/login')
  @HttpCode(200)
  async login(@Body() data: typeof loginUserZod, @Res() res: Response) {
    const token = await this.userService.login(data);

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      maxAge: 2592000000,
    });

    return res.json({
      state: 'success',
      message: 'Login successful.',
    });
  }

  @UseGuards(AuthGuard)
  @Post('/logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    const result = await this.userService.logout(req.cookies.token as string);

    if (result) {
      res.clearCookie('token');
      return res.json({
        state: 'success',
        message: 'Logout successful.',
      });
    }
  }
}
