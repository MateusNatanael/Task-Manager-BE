import { prisma } from '../../../config/prisma';
import { Criticality, MatrixType, Task, TaskStatus } from '@prisma/client';

export interface CreateTaskRepositoryData {
  description: string;
  unitId: string;
  equipmentId?: string | null;
  matrixType: MatrixType;
  priorityScore: number;
  criticality: Criticality;
  riskFactor?: string | null;
  createdById: string;
}

export interface FindTasksFilters {
  unitId?: string;
  status?: TaskStatus;
  ownerId?: string;
}

export class TaskRepository {
  async createWithInitialLog(data: CreateTaskRepositoryData): Promise<Task> {
    return prisma.$transaction(async (tx) => {
      const task = await tx.task.create({
        data: {
          description: data.description,
          unitId: data.unitId,
          equipmentId: data.equipmentId,
          matrixType: data.matrixType,
          priorityScore: data.priorityScore,
          criticality: data.criticality,
          riskFactor: data.riskFactor,
          createdById: data.createdById,
          status: TaskStatus.RECEIVED,
        },
        include: {
          unit: true,
          equipment: true,
          createdBy: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      });

      await tx.taskLog.create({
        data: {
          taskId: task.id,
          userId: data.createdById,
          previousStatus: null,
          newStatus: TaskStatus.RECEIVED,
          reason: 'Initial task creation',
        },
      });

      return task;
    });
  }

  async findAll(filters: FindTasksFilters = {}) {
    return prisma.task.findMany({
      where: {
        unitId: filters.unitId,
        status: filters.status,
        ownerId: filters.ownerId,
      },
      include: {
        unit: {
          select: { id: true, name: true, address: true },
        },
        equipment: {
          select: { id: true, tagId: true, category: true, specificLocation: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        owner: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: [
        { priorityScore: 'desc' },
        { createdAt: 'asc' },
      ],
    });
  }

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
        transitions: {
          include: {
            user: {
              select: { id: true, name: true, role: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        notes: {
          include: {
            user: {
              select: { id: true, name: true, role: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async findByOwnerId(ownerId: string) {
    return this.findAll({ ownerId });
  }
}
