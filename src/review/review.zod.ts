import { z } from 'zod';

const createReviewZod = z.object({
  orderItemId: z
    .string({ message: 'Product id is required.' })
    .min(36, 'Invalid product id.'),
  files: z
    .array(
      z.object({
        originalName: z.string({ message: 'File name is required.' }),
        encoding: z.string({ message: 'Encoding is required.' }),
        busBoyMimeType: z.string({ message: 'MIME type is required.' }),
        path: z.string({ message: 'File path is required.' }),
        size: z.number().max(5 * 1024 * 1024, {
          message: 'File size must not exceed 5 MB.',
        }),
        fileType: z.object({
          ext: z.string({ message: 'File extension is required.' }),
          mime: z.string({ message: 'MIME type is required.' }),
        }),
      }),
      { message: 'At least one image is required.' },
    )
    .min(1, { message: 'At least one file is required.' })
    .max(3, { message: 'A maximum of 3 files is allowed.' }),
  rating: z
    .string({ message: 'Rating is required.' })
    .min(1, 'Rating must be atleast 1.')
    .max(5, 'Rating must be atmost 5.'),
  comment: z
    .string({ message: 'Comment is required.' })
    .min(1, 'Comment can not be empty.'),
});

export { createReviewZod };
