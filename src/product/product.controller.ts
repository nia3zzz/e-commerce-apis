import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ProductService } from './product.service';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @UseGuards(AuthGuard)
  @Get('/products')
  getProducts(
    @Query('category') category: string | null = null,
    @Query('price_min') priceMin: number = 0,
    @Query('price_max')
    priceMax: number = 2147483647,
    @Query('offset') offset: number = 0,
    @Query('limit') limit: number = 10,
  ) {
    return this.productService.getProducts({
      category,
      priceMin,
      priceMax,
      offset,
      limit,
    });
  }

  @UseGuards(AuthGuard)
  @Get('/:id')
  getProduct(@Param() params: any) {
    return this.productService.getProduct(params.id);
  }
}
