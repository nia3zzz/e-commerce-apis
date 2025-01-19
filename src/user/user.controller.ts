import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { createUserZod } from './user.zod';

@Controller('/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/')
  createUser(@Body() data: typeof createUserZod) {
    return this.userService.createUser(data);
  }
}
