import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  createUserZod,
  loginUserZod,
  updateProfilePictureZod,
} from './user.zod';
import { Request, Response } from 'express';
import { AuthGuard } from 'src/auth/auth.guard';
import { FileSystemStoredFile, FormDataRequest } from 'nestjs-form-data';

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

  @UseGuards(AuthGuard)
  @Put('/profilepicture')
  @FormDataRequest({ storage: FileSystemStoredFile })
  updateProfilePicture(
    @Req() req: Request,
    @Body() data: typeof updateProfilePictureZod,
  ) {
    return this.userService.updateProfilePicture(
      data,
      req.cookies.token as string,
    );
  }

  @UseGuards(AuthGuard)
  @Delete('/profilepicture')
  async deleteProfilePicture(@Req() req: Request) {
    return this.userService.removeProfilePicture(req.cookies.token as string);
  }
}
