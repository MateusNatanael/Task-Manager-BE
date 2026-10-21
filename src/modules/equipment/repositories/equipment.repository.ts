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

  async create(data: {
    tagId: string;
    category: EquipmentCategory;
    unitId: string;
    specificLocation: string;
    observedFault?: string | null;
    preventiveData?: any;
  }) {
    return prisma.equipment.create({
      data,
      include: {
        unit: {
          select: { id: true, name: true, address: true },
        },
      },
    });
  }

  async update(
    id: string,
    data: {
      tagId?: string;
      category?: EquipmentCategory;
      unitId?: string;
      specificLocation?: string;
      observedFault?: string | null;
      preventiveData?: any;
    }
  ) {
    return prisma.equipment.update({
      where: { id },
      data,
      include: {
        unit: {
          select: { id: true, name: true, address: true },
        },
      },
    });
  }

  async findTasksByEquipmentId(equipmentId: string) {
    return prisma.task.findMany({
      where: { equipmentId },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        owner: {
          select: { id: true, name: true, email: true, role: true },
        },
        transitions: {
          include: {
            user: { select: { id: true, name: true, role: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

