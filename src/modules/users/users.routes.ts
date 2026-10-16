import { Router } from 'express';
import { ensureAuthenticated } from '../../shared/middlewares/ensure-authenticated';

const authRoutes = Router();
const usersRoutes = Router();

// POST /api/auth/login - Returns JWT (id, role, unitId)
authRoutes.post('/login', async (_req, res) => {
  res.json({ message: 'Auth login route placeholder' });
});

// GET /api/users - User list (?role=OPERATOR&unitId=...)
usersRoutes.get('/', ensureAuthenticated, async (_req, res) => {
  res.json({ message: 'Users route placeholder' });
});

export { authRoutes, usersRoutes };
