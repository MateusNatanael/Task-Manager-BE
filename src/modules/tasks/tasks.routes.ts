import { Router } from 'express';
import { TaskController } from './controllers/task.controller';
import { ensureAuthenticated, ensureRole } from '../../shared/middlewares/ensure-authenticated';
import { validateBody, validateQuery } from '../../shared/middlewares/validate-request';
import {
  createTaskSchema,
  listTasksQuerySchema,
  assignTaskSchema,
  updateTaskStatusSchema,
  createTaskNoteSchema,
} from './dtos/task.dto';
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

// PATCH /api/tasks/:id/assign - Assign owner (Restricted to management roles)
tasksRoutes.patch(
  '/:id/assign',
  ensureRole([Role.ANALYST, Role.MANAGER, Role.SUPERVISOR, Role.FOREMAN]),
  validateBody(assignTaskSchema),
  taskController.assign
);

// PATCH /api/tasks/:id/status - Transition status with state machine checks
tasksRoutes.patch(
  '/:id/status',
  validateBody(updateTaskStatusSchema),
  taskController.updateStatus
);

// POST /api/tasks/:id/notes - Add note and image URLs
tasksRoutes.post(
  '/:id/notes',
  validateBody(createTaskNoteSchema),
  taskController.addNote
);

// GET /api/tasks/:id/history - Chronological transition logs
tasksRoutes.get('/:id/history', taskController.history);

export { tasksRoutes };
