import { Router } from 'express';
import { authRoutes, usersRoutes } from './modules/users/users.routes';
import { unitsRoutes } from './modules/units/units.routes';
import { equipmentRoutes } from './modules/equipment/equipment.routes';
import { tasksRoutes } from './modules/tasks/tasks.routes';

const routes = Router();

routes.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

routes.use('/api/auth', authRoutes);
routes.use('/api/users', usersRoutes);
routes.use('/api/units', unitsRoutes);
routes.use('/api/equipment', equipmentRoutes);
routes.use('/api/tasks', tasksRoutes);

export { routes };
