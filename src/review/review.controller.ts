import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ReviewService } from './review.service';
import { createReviewZod } from './review.zod';
import { Request } from 'express';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @UseGuards(AuthGuard)
  @Post()
  addReview(@Req() req: Request, @Body() data: typeof createReviewZod) {
    return this.reviewService.addReview(data, req.cookies.token as string);
  }
}
