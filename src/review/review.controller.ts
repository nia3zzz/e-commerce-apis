import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { createReviewZod } from './review.zod';
import { Request } from 'express';
import { AuthGuard } from 'src/auth/auth.guard';
import { FileSystemStoredFile, FormDataRequest } from 'nestjs-form-data';

@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @UseGuards(AuthGuard)
  @Post()
  @FormDataRequest({ storage: FileSystemStoredFile })
  addReview(@Req() req: Request, @Body() data: typeof createReviewZod) {
    return this.reviewService.addReview(data, req.cookies.token as string);
  }

  @UseGuards(AuthGuard)
  @Get('/:id')
  getReviews(@Param() params: any) {
    return this.reviewService.getReviews(params.id);
  }

  @UseGuards(AuthGuard)
  @Delete('/:id')
  deleteReview(@Req() req: Request, @Param() params: any) {
    return this.reviewService.deleteReview(
      params.id,
      req.cookies.token as string,
    );
  }
}
