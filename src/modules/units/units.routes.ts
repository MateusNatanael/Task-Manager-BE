import { Router } from 'express';
import { ensureAuthenticated } from '../../shared/middlewares/ensure-authenticated';

const unitsRoutes = Router();

// GET /api/units - Branch/unit listing
unitsRoutes.get('/', ensureAuthenticated, async (_req, res) => {
  res.json({ message: 'Units route placeholder' });
});

export { unitsRoutes };
