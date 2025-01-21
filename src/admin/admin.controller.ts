import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { createCategoryZod } from './admin.zod';
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
}
