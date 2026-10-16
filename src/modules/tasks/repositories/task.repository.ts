import { prisma } from '../../../config/prisma';

export class TaskRepository {
  async findById(id: string) {
    return prisma.task.findUnique({
      where: { id },
      include: {
        unit: true,
        equipment: true,
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        owner: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });
  }
}
