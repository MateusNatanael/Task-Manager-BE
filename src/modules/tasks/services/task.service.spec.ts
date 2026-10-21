import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskService } from './task.service';
import { Criticality, MatrixType, Role, TaskStatus } from '@prisma/client';
import { AppError } from '../../../shared/errors/app-error';

describe('TaskService', () => {
  let taskService: TaskService;
  let taskRepositoryMock: any;
  let unitsRepositoryMock: any;
  let equipmentRepositoryMock: any;
  let usersRepositoryMock: any;

  beforeEach(() => {
    taskRepositoryMock = {
      createWithInitialLog: vi.fn(),
      findAll: vi.fn(),
      findByOwnerId: vi.fn(),
      findById: vi.fn(),
      assignOwner: vi.fn(),
      updateStatusWithLog: vi.fn(),
      createNote: vi.fn(),
      findHistory: vi.fn(),
    };

    unitsRepositoryMock = {
      findById: vi.fn(),
      findAll: vi.fn(),
    };

    equipmentRepositoryMock = {
      findById: vi.fn(),
      findAll: vi.fn(),
    };

    usersRepositoryMock = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      findAll: vi.fn(),
    };

    taskService = new TaskService(
      taskRepositoryMock,
      unitsRepositoryMock,
      equipmentRepositoryMock,
      usersRepositoryMock
    );
  });

  describe('calculateGUTCriticality', () => {
    it('should calculate HIGH criticality when score >= 80', () => {
      const result = TaskService.calculateGUTCriticality(5, 5, 4); // 100
      expect(result.score).toBe(100);
      expect(result.criticality).toBe(Criticality.HIGH);
    });

    it('should calculate MEDIUM criticality when 30 <= score < 80', () => {
      const result = TaskService.calculateGUTCriticality(3, 4, 3); // 36
      expect(result.score).toBe(36);
      expect(result.criticality).toBe(Criticality.MEDIUM);
    });

    it('should calculate LOW criticality when score < 30', () => {
      const result = TaskService.calculateGUTCriticality(2, 2, 2); // 8
      expect(result.score).toBe(8);
      expect(result.criticality).toBe(Criticality.LOW);
    });
  });

  describe('createTask', () => {
    const validTaskPayload = {
      description: 'Troca de fiação no gerador',
      unitId: 'unit-1',
      matrixType: MatrixType.GUT,
      gravity: 4,
      urgency: 4,
      trend: 4,
    };

    it('should throw 403 when user does not have MANAGER or ANALYST role', async () => {
      await expect(
        taskService.createTask(validTaskPayload, { id: 'user-1', role: Role.OPERATOR })
      ).rejects.toThrow(new AppError('Only ANALYST or MANAGER roles can create tasks', 403));
    });

    it('should throw 404 when unit does not exist or is inactive', async () => {
      unitsRepositoryMock.findById.mockResolvedValue(null);

      await expect(
        taskService.createTask(validTaskPayload, { id: 'user-1', role: Role.MANAGER })
      ).rejects.toThrow(new AppError('Unit not found or inactive', 404));
    });

    it('should throw 400 when equipment does not belong to specified unit', async () => {
      unitsRepositoryMock.findById.mockResolvedValue({ id: 'unit-1', isActive: true });
      equipmentRepositoryMock.findById.mockResolvedValue({ id: 'eq-1', unitId: 'unit-other' });

      await expect(
        taskService.createTask(
          { ...validTaskPayload, equipmentId: 'eq-1' },
          { id: 'user-1', role: Role.MANAGER }
        )
      ).rejects.toThrow(new AppError('Equipment does not belong to the specified unit', 400));
    });

    it('should create task successfully with initial log', async () => {
      unitsRepositoryMock.findById.mockResolvedValue({ id: 'unit-1', isActive: true });
      const createdTaskMock = { id: 'task-1', ...validTaskPayload, priorityScore: 64, criticality: Criticality.MEDIUM };
      taskRepositoryMock.createWithInitialLog.mockResolvedValue(createdTaskMock);

      const result = await taskService.createTask(validTaskPayload, { id: 'user-1', role: Role.MANAGER });

      expect(unitsRepositoryMock.findById).toHaveBeenCalledWith('unit-1');
      expect(taskRepositoryMock.createWithInitialLog).toHaveBeenCalledWith(
        expect.objectContaining({
          description: validTaskPayload.description,
          unitId: 'unit-1',
          priorityScore: 64,
          criticality: Criticality.MEDIUM,
          createdById: 'user-1',
        })
      );
      expect(result).toEqual(createdTaskMock);
    });
  });

  describe('assignTask', () => {
    it('should throw 403 when assigning user does not have management role', async () => {
      await expect(
        taskService.assignTask('task-1', { ownerId: 'op-1' }, { id: 'op-2', role: Role.OPERATOR })
      ).rejects.toThrow(new AppError('You do not have permission to assign tasks', 403));
    });

    it('should throw 404 when task does not exist', async () => {
      taskRepositoryMock.findById.mockResolvedValue(null);

      await expect(
        taskService.assignTask('task-999', { ownerId: 'op-1' }, { id: 'm-1', role: Role.MANAGER })
      ).rejects.toThrow(new AppError('Task not found', 404));
    });

    it('should throw 400 when trying to assign a completed (DONE) task', async () => {
      taskRepositoryMock.findById.mockResolvedValue({ id: 'task-1', status: TaskStatus.DONE });

      await expect(
        taskService.assignTask('task-1', { ownerId: 'op-1' }, { id: 'm-1', role: Role.MANAGER })
      ).rejects.toThrow(new AppError('Cannot reassign a completed task', 400));
    });

    it('should throw 404 when assigned technician is inactive or does not exist', async () => {
      taskRepositoryMock.findById.mockResolvedValue({ id: 'task-1', status: TaskStatus.RECEIVED });
      usersRepositoryMock.findById.mockResolvedValue(null);

      await expect(
        taskService.assignTask('task-1', { ownerId: 'op-inactive' }, { id: 'm-1', role: Role.MANAGER })
      ).rejects.toThrow(new AppError('Assigned user not found or inactive', 404));
    });

    it('should successfully assign owner and record transition', async () => {
      taskRepositoryMock.findById.mockResolvedValue({ id: 'task-1', status: TaskStatus.RECEIVED });
      usersRepositoryMock.findById.mockResolvedValue({ id: 'op-1', name: 'João Operador', role: Role.OPERATOR, isActive: true });
      taskRepositoryMock.assignOwner.mockResolvedValue({ id: 'task-1', ownerId: 'op-1', status: TaskStatus.ASSIGNED });

      const result = await taskService.assignTask('task-1', { ownerId: 'op-1' }, { id: 'm-1', role: Role.MANAGER });

      expect(taskRepositoryMock.assignOwner).toHaveBeenCalledWith(
        'task-1',
        'op-1',
        'm-1',
        expect.stringContaining('João Operador')
      );
      expect(result?.status).toBe(TaskStatus.ASSIGNED);
    });
  });

  describe('updateTaskStatus', () => {
    it('should throw 404 if task is not found', async () => {
      taskRepositoryMock.findById.mockResolvedValue(null);

      await expect(
        taskService.updateTaskStatus('task-999', { newStatus: TaskStatus.IN_PROGRESS }, { id: 'u-1', role: Role.OPERATOR })
      ).rejects.toThrow(new AppError('Task not found', 404));
    });

    it('should throw 422 when blocking task without sufficient reason or proof attachment', async () => {
      taskRepositoryMock.findById.mockResolvedValue({ id: 'task-1', status: TaskStatus.IN_PROGRESS });

      await expect(
        taskService.updateTaskStatus(
          'task-1',
          { newStatus: TaskStatus.BLOCKED, reason: 'Curto' }, // menos de 10 caracteres e sem attachmentUrl
          { id: 'op-1', role: Role.OPERATOR }
        )
      ).rejects.toThrow(new AppError('Blocking a task requires a reason (>= 10 characters) and an attachmentUrl proof', 422));
    });

    it('should block task successfully when reason and attachmentUrl are provided', async () => {
      taskRepositoryMock.findById.mockResolvedValue({ id: 'task-1', status: TaskStatus.IN_PROGRESS });
      taskRepositoryMock.updateStatusWithLog.mockResolvedValue({ id: 'task-1', status: TaskStatus.BLOCKED });

      const result = await taskService.updateTaskStatus(
        'task-1',
        {
          newStatus: TaskStatus.BLOCKED,
          reason: 'Aguardando peças do fornecedor',
          attachmentUrl: 'https://cdn.example.com/foto.jpg',
        },
        { id: 'op-1', role: Role.OPERATOR }
      );

      expect(taskRepositoryMock.updateStatusWithLog).toHaveBeenCalledWith(
        expect.objectContaining({
          taskId: 'task-1',
          newStatus: TaskStatus.BLOCKED,
          reason: 'Aguardando peças do fornecedor',
          attachmentUrl: 'https://cdn.example.com/foto.jpg',
        })
      );
      expect(result?.status).toBe(TaskStatus.BLOCKED);
    });

    it('should throw 422 when unblocking without a valid resolution reason', async () => {
      taskRepositoryMock.findById.mockResolvedValue({ id: 'task-1', status: TaskStatus.BLOCKED });

      await expect(
        taskService.updateTaskStatus(
          'task-1',
          { newStatus: TaskStatus.IN_PROGRESS, reason: 'ok' }, // menos de 5 caracteres
          { id: 'op-1', role: Role.OPERATOR }
        )
      ).rejects.toThrow(new AppError('Unblocking a task requires a reason describing the resolution (minimum 5 characters)', 422));
    });

    it('should set deliveryDate when transitioning IN_PROGRESS to DONE', async () => {
      taskRepositoryMock.findById.mockResolvedValue({ id: 'task-1', status: TaskStatus.IN_PROGRESS });
      taskRepositoryMock.updateStatusWithLog.mockResolvedValue({ id: 'task-1', status: TaskStatus.DONE });

      const result = await taskService.updateTaskStatus(
        'task-1',
        { newStatus: TaskStatus.DONE, reason: 'Manutenção finalizada com sucesso' },
        { id: 'op-1', role: Role.OPERATOR }
      );

      expect(taskRepositoryMock.updateStatusWithLog).toHaveBeenCalledWith(
        expect.objectContaining({
          taskId: 'task-1',
          newStatus: TaskStatus.DONE,
          deliveryDate: expect.any(Date),
        })
      );
      expect(result?.status).toBe(TaskStatus.DONE);
    });

    it('should allow manager to approve and accept delivery for a DONE task', async () => {
      taskRepositoryMock.findById.mockResolvedValue({
        id: 'task-1',
        status: TaskStatus.DONE,
        acceptedDate: null,
      });
      taskRepositoryMock.updateStatusWithLog.mockResolvedValue({
        id: 'task-1',
        status: TaskStatus.DONE,
        acceptedDate: new Date(),
      });

      const result = await taskService.updateTaskStatus(
        'task-1',
        { newStatus: TaskStatus.DONE, reason: 'Aprovado pelo gestor' },
        { id: 'm-1', role: Role.MANAGER }
      );

      expect(taskRepositoryMock.updateStatusWithLog).toHaveBeenCalledWith(
        expect.objectContaining({
          taskId: 'task-1',
          acceptedDate: expect.any(Date),
        })
      );
      expect(result?.status).toBe(TaskStatus.DONE);
    });
  });

  describe('addNote and getTaskHistory', () => {
    it('should add a note to a task', async () => {
      taskRepositoryMock.findById.mockResolvedValue({ id: 'task-1' });
      const noteMock = { id: 'note-1', text: 'Nota de teste', imageUrls: [] };
      taskRepositoryMock.createNote.mockResolvedValue(noteMock);

      const result = await taskService.addNote('task-1', { text: 'Nota de teste', imageUrls: [] }, { id: 'u-1' });

      expect(taskRepositoryMock.createNote).toHaveBeenCalledWith({
        taskId: 'task-1',
        userId: 'u-1',
        text: 'Nota de teste',
        imageUrls: [],
      });
      expect(result).toEqual(noteMock);
    });

    it('should return chronological history logs', async () => {
      taskRepositoryMock.findById.mockResolvedValue({ id: 'task-1' });
      const logsMock = [{ id: 'log-1', newStatus: TaskStatus.RECEIVED }];
      taskRepositoryMock.findHistory.mockResolvedValue(logsMock);

      const result = await taskService.getTaskHistory('task-1');

      expect(taskRepositoryMock.findHistory).toHaveBeenCalledWith('task-1');
      expect(result).toEqual(logsMock);
    });
  });
});
