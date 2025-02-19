import { z } from 'zod';

const createReviewZod = z.object({
  orderItemId: z
    .string({ message: 'Product id is required.' })
    .min(36, 'Invalid product id.'),
  rating: z
    .number({ message: 'Rating is required.' })
    .min(1, 'Rating must be atleast 1.')
    .max(5, 'Rating must be atmost 5.'),
  comment: z
    .string({ message: 'Comment is required.' })
    .min(1, 'Comment can not be empty.'),
});

export { createReviewZod };
