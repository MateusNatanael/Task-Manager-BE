import { Router } from 'express';
import { AuthController } from './controllers/auth.controller';
import { UsersController } from './controllers/users.controller';
import { ensureAuthenticated } from '../../shared/middlewares/ensure-authenticated';
import { validateBody, validateQuery } from '../../shared/middlewares/validate-request';
import { loginSchema, listUsersQuerySchema } from './dtos/auth.dto';

const authRoutes = Router();
const usersRoutes = Router();

const authController = new AuthController();
const usersController = new UsersController();

// POST /api/auth/login - Returns JWT (id, role, unitId)
authRoutes.post('/login', validateBody(loginSchema), authController.login);

// GET /api/users - User list (?role=OPERATOR&unitId=...)
usersRoutes.get(
  '/',
  ensureAuthenticated,
  validateQuery(listUsersQuerySchema),
  usersController.list
);

export { authRoutes, usersRoutes };
