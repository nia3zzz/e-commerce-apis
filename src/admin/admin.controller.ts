import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import {
  createCategoryZod,
  updateCategoryZod,
  createProductZod,
  updateProductZod,
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

  @UseGuards(AdminAuthGuard)
  @Put('/product/:id')
  updateProduct(
    @Body() data: z.infer<typeof updateProductZod>,
    @Param() params: any,
  ) {
    return this.adminService.updateProduct(data, params.id);
  }

  @UseGuards(AdminAuthGuard)
  @Delete('/product/:id')
  deleteProduct(@Param() params: any) {
    return this.adminService.deleteProduct(params.id);
  }

  @UseGuards(AdminAuthGuard)
  @Get('/product')
  getProducts(
    @Query('category') category: string | null = null,
    @Query('price_min') priceMin: number = 0,
    @Query('price_max')
    priceMax: number = 2147483647,
    @Query('offset') offset: number = 0,
    @Query('limit') limit: number = 10,
  ) {
    return this.adminService.getProducts({
      category,
      priceMin,
      priceMax,
      offset,
      limit,
    });
  }
}
