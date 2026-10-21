import { Request, Response } from 'express';
import { TaskService } from '../services/task.service';
import { TaskStatus } from '@prisma/client';
import { AppError } from '../../../shared/errors/app-error';

export class TaskController {
  constructor(private taskService: TaskService = new TaskService()) {}

  create = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const task = await this.taskService.createTask(req.body, {
      id: req.user.id,
      role: req.user.role,
    });

    res.status(201).json(task);
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const { unitId, status, ownerId } = req.query;

    const tasks = await this.taskService.listTasks({
      unitId: unitId ? String(unitId) : undefined,
      status: status ? (status as TaskStatus) : undefined,
      ownerId: ownerId ? String(ownerId) : undefined,
    });

    res.json(tasks);
  };

  myTasks = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const tasks = await this.taskService.listMyTasks(req.user.id);
    res.json(tasks);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!id) {
      throw new AppError('Task ID is required', 400);
    }

    const task = await this.taskService.getTaskById(id);
    res.json(task);
  };

  assign = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) {
      throw new AppError('Task ID is required', 400);
    }

    const updatedTask = await this.taskService.assignTask(id, req.body, {
      id: req.user.id,
      role: req.user.role,
    });

    res.json(updatedTask);
  };

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) {
      throw new AppError('Task ID is required', 400);
    }

    const updatedTask = await this.taskService.updateTaskStatus(id, req.body, {
      id: req.user.id,
      role: req.user.role,
    });

    res.json(updatedTask);
  };

  addNote = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) {
      throw new AppError('Task ID is required', 400);
    }

    const note = await this.taskService.addNote(id, req.body, {
      id: req.user.id,
    });

    res.status(201).json(note);
  };

  history = async (req: Request, res: Response): Promise<void> => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) {
      throw new AppError('Task ID is required', 400);
    }

    const logs = await this.taskService.getTaskHistory(id);
    res.json(logs);
  };

  metrics = async (req: Request, res: Response): Promise<void> => {
    const { unitId, startDate, endDate } = req.query;

    const data = await this.taskService.getMetrics({
      unitId: unitId ? String(unitId) : undefined,
      startDate: startDate ? String(startDate) : undefined,
      endDate: endDate ? String(endDate) : undefined,
    });

    res.json(data);
  };
}

