import { Router } from 'express';
import { TaskController } from './controllers/task.controller';
import { ensureAuthenticated, ensureRole } from '../../shared/middlewares/ensure-authenticated';
import { validateBody, validateQuery } from '../../shared/middlewares/validate-request';
import { createTaskSchema, listTasksQuerySchema } from './dtos/task.dto';
import { Role } from '@prisma/client';

const tasksRoutes = Router();
const taskController = new TaskController();

tasksRoutes.use(ensureAuthenticated);

// GET /api/tasks - General list sorted by priorityScore DESC, createdAt ASC
tasksRoutes.get('/', validateQuery(listTasksQuerySchema), taskController.list);

// GET /api/tasks/my-tasks - Current operator's assigned tasks
tasksRoutes.get('/my-tasks', taskController.myTasks);

// GET /api/tasks/:id - Task details
tasksRoutes.get('/:id', taskController.getById);

// POST /api/tasks - Create task with matrix calculation (Restricted to ANALYST or MANAGER)
tasksRoutes.post(
  '/',
  ensureRole([Role.ANALYST, Role.MANAGER]),
  validateBody(createTaskSchema),
  taskController.create
);

// PATCH /api/tasks/:id/assign - Assign owner (Placeholder for next step)
tasksRoutes.patch('/:id/assign', async (_req, res) => {
  res.json({ message: 'Assign task placeholder' });
});

// PATCH /api/tasks/:id/status - Transition status (Placeholder for next step)
tasksRoutes.patch('/:id/status', async (_req, res) => {
  res.json({ message: 'Update task status placeholder' });
});

// POST /api/tasks/:id/notes - Add note/images (Placeholder for next step)
tasksRoutes.post('/:id/notes', async (_req, res) => {
  res.json({ message: 'Add task note placeholder' });
});

// GET /api/tasks/:id/history - Chronological transition logs (Placeholder for next step)
tasksRoutes.get('/:id/history', async (_req, res) => {
  res.json({ message: 'Task history placeholder' });
});

export { tasksRoutes };
