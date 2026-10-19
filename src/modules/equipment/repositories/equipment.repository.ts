import { prisma } from '../../../config/prisma';
import { EquipmentCategory } from '@prisma/client';

export interface FindEquipmentFilters {
  unitId?: string;
  category?: EquipmentCategory;
}

export class EquipmentRepository {
  async findAll(filters: FindEquipmentFilters = {}) {
    return prisma.equipment.findMany({
      where: {
        unitId: filters.unitId,
        category: filters.category,
      },
      include: {
        unit: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        tagId: 'asc',
      },
    });
  }

  async findById(id: string) {
    return prisma.equipment.findUnique({
      where: { id },
      include: {
        unit: true,
      },
    });
  }

  async findByTagId(tagId: string) {
    return prisma.equipment.findUnique({
      where: { tagId },
    });
  }
}
