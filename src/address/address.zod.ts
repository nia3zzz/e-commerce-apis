import { z } from 'zod';

const createAddressZod = z.object({
  street: z
    .string({ message: 'Street is required.' })
    .min(1, 'Street can not be empty.'),
  city: z
    .string({ message: 'City is required.' })
    .min(1, 'City can not be empty.'),
  state: z
    .string({ message: 'State is required.' })
    .min(1, 'State can not be empty.'),
  postalCode: z
    .string({ message: 'Postal code is required.' })
    .min(2, 'Postal code can not be empty.'),
  country: z
    .string({ message: 'Country is required.' })
    .min(4, 'Country can not be empty.'),
});

const updateAddressZod = z.object({
  street: z
    .string({ message: 'Street is required.' })
    .min(1, 'Street can not be empty.'),
  city: z
    .string({ message: 'City is required.' })
    .min(1, 'City can not be empty'),
  state: z
    .string({ message: 'State is required.' })
    .min(1, 'State can not be empty'),
  postalCode: z
    .string({ message: 'Postal code is required.' })
    .min(2, 'Postal code can not be empty'),
  country: z
    .string({ message: 'Country is required.' })
    .min(4, 'Country can not be empty'),
});

export { createAddressZod, updateAddressZod };
