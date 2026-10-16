import { z } from 'zod';
import { MatrixType } from '@prisma/client';

export const createTaskSchema = z.object({
  description: z.string().min(3),
  unitId: z.string().uuid(),
  equipmentId: z.string().uuid().optional(),
  matrixType: z.nativeEnum(MatrixType).default(MatrixType.GUT),
  gravity: z.number().int().min(1).max(5),
  urgency: z.number().int().min(1).max(5),
  trend: z.number().int().min(1).max(5),
  riskFactor: z.string().optional(),
});

export const assignTaskSchema = z.object({
  ownerId: z.string().uuid(),
});

export const updateTaskStatusSchema = z.object({
  newStatus: z.enum(['RECEIVED', 'ASSIGNED', 'IN_PROGRESS', 'BLOCKED', 'DONE']),
  reason: z.string().optional(),
  attachmentUrl: z.string().url().optional(),
});

export const createTaskNoteSchema = z.object({
  text: z.string().min(1),
  imageUrls: z.array(z.string().url()).optional().default([]),
});
