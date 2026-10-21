import { Router } from 'express';
import { EquipmentController } from './controllers/equipment.controller';
import { ensureAuthenticated, ensureRole } from '../../shared/middlewares/ensure-authenticated';
import { validateBody, validateQuery } from '../../shared/middlewares/validate-request';
import {
  listEquipmentQuerySchema,
  createEquipmentSchema,
  updateEquipmentSchema,
} from './dtos/equipment.dto';
import { Role } from '@prisma/client';

const equipmentRoutes = Router();
const equipmentController = new EquipmentController();

equipmentRoutes.use(ensureAuthenticated);

// GET /api/equipment - Asset list with filters (?unitId=...&category=...)
equipmentRoutes.get(
  '/',
  validateQuery(listEquipmentQuerySchema),
  equipmentController.list
);

// GET /api/equipment/:id - Equipment details
equipmentRoutes.get('/:id', equipmentController.getById);

// GET /api/equipment/:id/tasks - Maintenance/task history for this equipment
equipmentRoutes.get('/:id/tasks', equipmentController.tasks);

// POST /api/equipment - Create new equipment asset (Restricted to management/foreman)
equipmentRoutes.post(
  '/',
  ensureRole([Role.ANALYST, Role.MANAGER, Role.SUPERVISOR, Role.FOREMAN]),
  validateBody(createEquipmentSchema),
  equipmentController.create
);

// PATCH /api/equipment/:id - Update equipment asset/fault data (Restricted to management/foreman)
equipmentRoutes.patch(
  '/:id',
  ensureRole([Role.ANALYST, Role.MANAGER, Role.SUPERVISOR, Role.FOREMAN]),
  validateBody(updateEquipmentSchema),
  equipmentController.update
);

export { equipmentRoutes };

