import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { createCategoryZod, updateCategoryZod } from './admin.zod';
import { AdminAuthGuard } from './admin.guard';

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
}
