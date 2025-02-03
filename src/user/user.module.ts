import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { NestjsFormDataModule } from 'nestjs-form-data';

@Module({
  imports: [NestjsFormDataModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
