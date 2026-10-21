import { z } from 'zod';
import { MatrixType, TaskStatus } from '@prisma/client';

const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const uuidSchema = z.string().regex(uuidRegex, 'Invalid UUID format');

export const createTaskSchema = z.object({
  description: z.string().min(3, 'Description must have at least 3 characters'),
  unitId: uuidSchema,
  equipmentId: uuidSchema.optional().nullable(),
  matrixType: z.nativeEnum(MatrixType).default(MatrixType.GUT),
  gravity: z.number().int().min(1, 'Gravity must be between 1 and 5').max(5, 'Gravity must be between 1 and 5'),
  urgency: z.number().int().min(1, 'Urgency must be between 1 and 5').max(5, 'Urgency must be between 1 and 5'),
  trend: z.number().int().min(1, 'Trend must be between 1 and 5').max(5, 'Trend must be between 1 and 5'),
  riskFactor: z.string().optional().nullable(),
});

export type CreateTaskDTO = z.infer<typeof createTaskSchema>;

export const listTasksQuerySchema = z.object({
  unitId: uuidSchema.optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  ownerId: uuidSchema.optional(),
});

export type ListTasksQueryDTO = z.infer<typeof listTasksQuerySchema>;

export const assignTaskSchema = z.object({
  ownerId: uuidSchema,
});

export type AssignTaskDTO = z.infer<typeof assignTaskSchema>;

export const updateTaskStatusSchema = z.object({
  newStatus: z.nativeEnum(TaskStatus),
  reason: z.string().optional(),
  attachmentUrl: z.string().url().optional(),
});

export type UpdateTaskStatusDTO = z.infer<typeof updateTaskStatusSchema>;

export const createTaskNoteSchema = z.object({
  text: z.string().min(1, 'Note text is required'),
  imageUrls: z.array(z.string().url()).optional().default([]),
});

export type CreateTaskNoteDTO = z.infer<typeof createTaskNoteSchema>;

export const tasksMetricsQuerySchema = z.object({
  unitId: uuidSchema.optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type TasksMetricsQueryDTO = z.infer<typeof tasksMetricsQuerySchema>;
