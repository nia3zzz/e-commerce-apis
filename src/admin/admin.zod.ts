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
    .min(3, 'Name must be atleast 3 characters.'),
  description: z
    .string({ message: 'Description  can not be empty.' })
    .min(1, 'Description can not be empty.'),
  price: z
    .number({ message: 'Price is required.' })
    .min(1, 'Price can not be empty.'),
  categoryId: z.string({ message: 'Category is required.' }),
  stock: z.number().optional(),
});

const updateProductZod = z.object({
  name: z
    .string({ message: 'Name is required.' })
    .min(3, 'Name must be atleast 3 characters.'),
  description: z
    .string({ message: 'Description  can not be empty.' })
    .min(1, 'Description can not be empty.'),
  price: z
    .number({ message: 'Price is required.' })
    .min(1, 'Price can not be empty.'),
  categoryId: z.string({ message: 'Category is required.' }),
  stock: z.number({ message: 'Stock is required.' }),
});

const editOrderZod = z.object({
  status: z.enum(['PENDING', 'COMPLETED'], {
    required_error: 'Status is required.',
  }),
});

export {
  createProductZod,
  createCategoryZod,
  updateCategoryZod,
  editOrderZod,
  updateProductZod,
};
