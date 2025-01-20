import { z } from 'zod';

const createUserZod = z.object({
  firstName: z
    .string({ message: 'First name is required.' })
    .min(3, 'First name must be atleast 3 characters.'),
  lastName: z.string().optional(),
  userName: z
    .string({ message: 'User name is required.' })
    .min(3, 'User name must be atleast 3 characters.'),
  email: z
    .string({ message: 'Email is required.' })
    .email({ message: 'Invalid email.' })
    .min(1, 'Email is required.'),
  password: z
    .string({ message: 'Password is required.' })
    .min(6, 'Password must be atleast 6 characters.'),
});

const loginUserZod = z
  .object({
    userName: z
      .string()
      .min(3, 'User name must be atleast 3 characters.')
      .optional(),
    email: z.string().optional(),
    password: z
      .string({ message: 'Password is required.' })
      .min(6, 'Password must be atleast 6 characters.'),
  })
  .refine((data) => data.userName || data.email, {
    message: 'User name or email is required.',
  });

export { createUserZod, loginUserZod };
