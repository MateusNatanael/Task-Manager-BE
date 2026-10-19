import { prisma } from '../../../config/prisma';
import { Role, User } from '@prisma/client';

export interface FindUsersFilters {
  role?: Role;
  unitId?: string;
  isActive?: boolean;
}

export class UsersRepository {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async findAll(filters: FindUsersFilters = {}) {
    return prisma.user.findMany({
      where: {
        role: filters.role,
        unitId: filters.unitId,
        isActive: filters.isActive ?? true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        specialty: true,
        unitId: true,
        isActive: true,
        createdAt: true,
        unit: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }
}
