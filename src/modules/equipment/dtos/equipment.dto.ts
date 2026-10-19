import { z } from 'zod';
import { EquipmentCategory } from '@prisma/client';

export const listEquipmentQuerySchema = z.object({
  unitId: z.string().uuid().optional(),
  category: z.nativeEnum(EquipmentCategory).optional(),
});

export type ListEquipmentQueryDTO = z.infer<typeof listEquipmentQuerySchema>;
