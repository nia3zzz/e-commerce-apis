import { z } from 'zod';

const createCategoryZod = z.object({
  name: z
    .string({ message: 'Name is required.' })
    .min(3, 'Name must be atleast 3 characters.'),
  description: z
    .string({ message: ' Description is required.' })
    .min(10, 'Description can not be empty.'),
  totalProducts: z.number().optional(),
});

const updateCategoryZod = z.object({
  name: z
    .string({ message: 'Name is required.' })
    .min(3, 'Name must be atleast 3 characters.'),
  totalProducts: z
    .number({ message: 'Total products is required.' })
    .min(1, 'Total products can not be empty.'),
});

const createProductZod = z.object({
  name: z
    .string({ message: 'Name is required.' })
    .min(3, 'Name must be at least 3 characters.'),
  description: z
    .string({ message: 'Description cannot be empty.' })
    .min(1, 'Description cannot be empty.'),
  price: z
    .string({ message: 'Price is required.' })
    .min(1, 'Price cannot be empty.'),
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
    .max(4, { message: 'A maximum of 4 files is allowed.' }),
  categoryId: z.string({ message: 'Category is required.' }),
  stock: z.string().optional(),
});

const updateProductZod = z.object({
  name: z
    .string({ message: 'Name is required.' })
    .min(3, 'Name must be atleast 3 characters.'),
  description: z
    .string({ message: 'Description can not be empty.' })
    .min(1, 'Description can not be empty.'),
  price: z
    .string({ message: 'Price is required.' })
    .min(1, 'Price can not be empty.'),
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
    .max(4, { message: 'A maximum of 4 files is allowed.' })
    .optional(),
  categoryId: z.string({ message: 'Category is required.' }),
  stock: z.string({ message: 'Stock is required.' }),
});

const updateOrderZod = z.object({
  status: z.enum(['PENDING', 'COMPLETED'], {
    required_error: 'Status is required.',
  }),
});

export {
  createProductZod,
  createCategoryZod,
  updateCategoryZod,
  updateOrderZod,
  updateProductZod,
};
