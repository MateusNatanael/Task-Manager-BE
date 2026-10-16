import { Router } from 'express';
import { ensureAuthenticated } from '../../shared/middlewares/ensure-authenticated';

const equipmentRoutes = Router();

// GET /api/equipment - Asset list with filters (?unitId=...&category=...)
equipmentRoutes.get('/', ensureAuthenticated, async (_req, res) => {
  res.json({ message: 'Equipment route placeholder' });
});

export { equipmentRoutes };
