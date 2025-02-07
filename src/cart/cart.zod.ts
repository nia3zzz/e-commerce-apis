import { z } from 'zod';

const addProductToCartZod = z.object({
  productId: z
    .string({ message: 'Product id is required.' })
    .min(36, 'Invalid product id.'),
  quantity: z
    .number({ message: 'Quantity is required.' })
    .positive({ message: 'Quantity must be greater than 0.' }),
});

const updateCartItemsZod = z.object({
  productInCartId: z
    .string({ message: 'Product id is required.' })
    .min(36, 'Invalid product id.'),
  quantity: z
    .number({ message: 'Quantity is required.' })
    .positive({ message: 'Quantity must be greater than 0.' }),
});

const removeCartItemZod = z.object({
  productInCartId: z
    .string({ message: 'Product id is required.' })
    .min(36, 'Invalid product id.'),
});

export { addProductToCartZod, updateCartItemsZod, removeCartItemZod };
