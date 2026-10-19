import { prisma } from '../../../config/prisma';
import { Unit } from '@prisma/client';

export class UnitsRepository {
  async findAll(isActive: boolean = true): Promise<Unit[]> {
    return prisma.unit.findMany({
      where: {
        isActive,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findById(id: string): Promise<Unit | null> {
    return prisma.unit.findUnique({
      where: { id },
    });
  }
}
