import { Router } from 'express';
import { TaskController } from './controllers/task.controller';
import { ensureAuthenticated } from '../../shared/middlewares/ensure-authenticated';

const tasksRoutes = Router();
const taskController = new TaskController();

tasksRoutes.use(ensureAuthenticated);

// GET /api/tasks - General list
tasksRoutes.get('/', async (_req, res) => {
  res.json({ message: 'List tasks placeholder' });
});

// GET /api/tasks/my-tasks - Current operator's assigned tasks
tasksRoutes.get('/my-tasks', async (_req, res) => {
  res.json({ message: 'My tasks placeholder' });
});

// GET /api/tasks/:id - Task details
tasksRoutes.get('/:id', taskController.getById);

// POST /api/tasks - Create task with matrix calculation
tasksRoutes.post('/', async (_req, res) => {
  res.json({ message: 'Create task placeholder' });
});

// PATCH /api/tasks/:id/assign - Assign owner
tasksRoutes.patch('/:id/assign', async (_req, res) => {
  res.json({ message: 'Assign task placeholder' });
});

// PATCH /api/tasks/:id/status - Transition status
tasksRoutes.patch('/:id/status', async (_req, res) => {
  res.json({ message: 'Update task status placeholder' });
});

// POST /api/tasks/:id/notes - Add note/images
tasksRoutes.post('/:id/notes', async (_req, res) => {
  res.json({ message: 'Add task note placeholder' });
});

// GET /api/tasks/:id/history - Chronological transition logs
tasksRoutes.get('/:id/history', async (_req, res) => {
  res.json({ message: 'Task history placeholder' });
});

export { tasksRoutes };
