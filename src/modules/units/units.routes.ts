import { Router } from 'express';
import { UnitsController } from './controllers/units.controller';
import { ensureAuthenticated } from '../../shared/middlewares/ensure-authenticated';

const unitsRoutes = Router();
const unitsController = new UnitsController();

// GET /api/units - Branch/unit listing
unitsRoutes.get('/', ensureAuthenticated, unitsController.list);

export { unitsRoutes };
