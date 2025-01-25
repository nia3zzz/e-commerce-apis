import { Global, Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { NestjsFormDataModule } from 'nestjs-form-data';

@Module({
  imports: [NestjsFormDataModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
