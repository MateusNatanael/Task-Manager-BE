import { Router } from 'express';
import { EquipmentController } from './controllers/equipment.controller';
import { ensureAuthenticated } from '../../shared/middlewares/ensure-authenticated';
import { validateQuery } from '../../shared/middlewares/validate-request';
import { listEquipmentQuerySchema } from './dtos/equipment.dto';

const equipmentRoutes = Router();
const equipmentController = new EquipmentController();

// GET /api/equipment - Asset list with filters (?unitId=...&category=...)
equipmentRoutes.get(
  '/',
  ensureAuthenticated,
  validateQuery(listEquipmentQuerySchema),
  equipmentController.list
);

export { equipmentRoutes };
