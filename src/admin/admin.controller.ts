import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import {
  createCategoryZod,
  updateCategoryZod,
  createProductZod,
} from './admin.zod';
import { AdminAuthGuard } from './admin.guard';
import { FormDataRequest, FileSystemStoredFile } from 'nestjs-form-data';
import { z } from 'zod';

@Controller({ host: 'admin.localhost' })
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @UseGuards(AdminAuthGuard)
  @Post('/category')
  createCategory(@Body() data: typeof createCategoryZod) {
    return this.adminService.createCategory(data);
  }

  @UseGuards(AdminAuthGuard)
  @Get('/category')
  getCategories() {
    return this.adminService.getCategories();
  }

  @UseGuards(AdminAuthGuard)
  @Put('/category/:id')
  updateCategory(@Body() data: typeof updateCategoryZod, @Param() params: any) {
    return this.adminService.updateCategory(data, params.id);
  }

  @UseGuards(AdminAuthGuard)
  @Delete('/category/:id')
  deleteCategory(@Param() params: any) {
    return this.adminService.deleteCategory(params.id);
  }

  @UseGuards(AdminAuthGuard)
  @Post('/product')
  @FormDataRequest({ storage: FileSystemStoredFile })
  async createProduct(@Body() data: z.infer<typeof createProductZod>) {
    return this.adminService.createProduct(data);
  }
}
