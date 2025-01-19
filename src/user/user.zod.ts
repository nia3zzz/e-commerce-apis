import { z } from 'zod';

const createUserZod = z.object({
  firstName: z
    .string({ message: 'First name is required.' })
    .min(1, 'First name is required.'),
  lastName: z.string().optional(),
  userName: z
    .string({ message: 'User name is required.' })
    .min(1, 'User name is required.'),
  email: z
    .string({ message: 'Email is required.' })
    .email({ message: 'Invalid email.' })
    .min(1, 'Email is required.'),
  password: z
    .string({ message: 'Password is required.' })
    .min(1, 'Password is required.'),
});

export { createUserZod };
