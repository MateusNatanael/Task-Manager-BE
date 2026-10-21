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

  async assignOwner(taskId: string, ownerId: string, assignedById: string, reason?: string) {
    return prisma.$transaction(async (tx) => {
      const currentTask = await tx.task.findUnique({ where: { id: taskId } });
      if (!currentTask) {
        return null;
      }

      const updatedTask = await tx.task.update({
        where: { id: taskId },
        data: {
          ownerId,
          status: TaskStatus.ASSIGNED,
        },
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

      await tx.taskLog.create({
        data: {
          taskId,
          userId: assignedById,
          previousStatus: currentTask.status,
          newStatus: TaskStatus.ASSIGNED,
          reason: reason || 'Task assigned to technician/operator',
        },
      });

      return updatedTask;
    });
  }

  async updateStatusWithLog(params: {
    taskId: string;
    userId: string;
    newStatus: TaskStatus;
    reason?: string;
    attachmentUrl?: string;
    deliveryDate?: Date | null;
    acceptedDate?: Date | null;
  }) {
    return prisma.$transaction(async (tx) => {
      const currentTask = await tx.task.findUnique({ where: { id: params.taskId } });
      if (!currentTask) {
        return null;
      }

      const updatedTask = await tx.task.update({
        where: { id: params.taskId },
        data: {
          status: params.newStatus,
          deliveryDate: params.deliveryDate !== undefined ? params.deliveryDate : currentTask.deliveryDate,
          acceptedDate: params.acceptedDate !== undefined ? params.acceptedDate : currentTask.acceptedDate,
        },
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

      await tx.taskLog.create({
        data: {
          taskId: params.taskId,
          userId: params.userId,
          previousStatus: currentTask.status,
          newStatus: params.newStatus,
          reason: params.reason,
          attachmentUrl: params.attachmentUrl,
        },
      });

      return updatedTask;
    });
  }

  async createNote(params: {
    taskId: string;
    userId: string;
    text: string;
    imageUrls: string[];
  }) {
    return prisma.taskNote.create({
      data: {
        taskId: params.taskId,
        userId: params.userId,
        text: params.text,
        imageUrls: params.imageUrls,
      },
      include: {
        user: {
          select: { id: true, name: true, role: true },
        },
      },
    });
  }

  async findHistory(taskId: string) {
    return prisma.taskLog.findMany({
      where: { taskId },
      include: {
        user: {
          select: { id: true, name: true, role: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findTasksForMetrics(filters: {
    unitId?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}) {
    return prisma.task.findMany({
      where: {
        unitId: filters.unitId,
        createdAt: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
      },
      select: {
        id: true,
        status: true,
        criticality: true,
        priorityScore: true,
        createdAt: true,
        deliveryDate: true,
        acceptedDate: true,
        equipmentId: true,
        equipment: {
          select: {
            id: true,
            tagId: true,
            category: true,
          },
        },
        transitions: {
          where: {
            newStatus: TaskStatus.BLOCKED,
          },
          select: {
            id: true,
          },
        },
      },
    });
  }
}
