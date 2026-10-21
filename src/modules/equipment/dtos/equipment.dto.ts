import { z } from 'zod';
import { EquipmentCategory } from '@prisma/client';

const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const uuidSchema = z.string().regex(uuidRegex, 'Invalid UUID format');

export const listEquipmentQuerySchema = z.object({
  unitId: uuidSchema.optional(),
  category: z.nativeEnum(EquipmentCategory).optional(),
});

export type ListEquipmentQueryDTO = z.infer<typeof listEquipmentQuerySchema>;

export const createEquipmentSchema = z.object({
  tagId: z.string().min(2, 'Tag ID must have at least 2 characters').toUpperCase(),
  category: z.nativeEnum(EquipmentCategory),
  unitId: uuidSchema,
  specificLocation: z.string().min(2, 'Specific location must have at least 2 characters'),
  observedFault: z.string().optional().nullable(),
  preventiveData: z.record(z.string(), z.any()).optional().default({}),
});

export type CreateEquipmentDTO = z.infer<typeof createEquipmentSchema>;

export const updateEquipmentSchema = z.object({
  tagId: z.string().min(2, 'Tag ID must have at least 2 characters').toUpperCase().optional(),
  category: z.nativeEnum(EquipmentCategory).optional(),
  unitId: uuidSchema.optional(),
  specificLocation: z.string().min(2, 'Specific location must have at least 2 characters').optional(),
  observedFault: z.string().optional().nullable(),
  preventiveData: z.record(z.string(), z.any()).optional(),
});

export type UpdateEquipmentDTO = z.infer<typeof updateEquipmentSchema>;
