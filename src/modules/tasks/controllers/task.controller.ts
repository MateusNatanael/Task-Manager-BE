import { Request, Response } from 'express';
import { TaskService } from '../services/task.service';
import { AppError } from '../../../shared/errors/app-error';

export class TaskController {
  constructor(private taskService: TaskService = new TaskService()) {}

  getById = async (req: Request, res: Response): Promise<void> => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!id) {
      throw new AppError('Task ID is required', 400);
    }

    const task = await this.taskService.getTaskById(id);

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    res.json(task);
  };
}
