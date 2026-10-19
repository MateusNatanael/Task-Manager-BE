import { z } from 'zod';
import { Role } from '@prisma/client';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginDTO = z.infer<typeof loginSchema>;

export const listUsersQuerySchema = z.object({
  role: z.nativeEnum(Role).optional(),
  unitId: z.string().uuid().optional(),
});

export type ListUsersQueryDTO = z.infer<typeof listUsersQuerySchema>;
