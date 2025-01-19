import { z } from 'zod';

const createCategoryZod = z.object({
  name: z.string({ message: 'Name is required.' }),
  description: z.string({ message: ' Description is required.' }),
  totalProducts: z.number().optional(),
});

const updateCategoryZod = z.object({
  name: z.string({ message: 'Name is required.' }),
  totalProducts: z.number({ message: 'Total products is required.' }),
});

const createProductZod = z.object({
  name: z.string({ message: 'Name is required.' }),
  description: z.string({ message: 'Description is required.' }),
  price: z.number({ message: 'Price is required.' }),
  categoryId: z.string({ message: 'Category is required.' }),
  stock: z.number().optional(),
});

const updateProductZod = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  price: z.number().optional(),
  categoryId: z.string(),
  stock: z.number().optional(),
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
