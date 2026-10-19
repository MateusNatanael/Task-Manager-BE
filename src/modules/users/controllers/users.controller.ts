import { Request, Response } from 'express';
import { UsersService } from '../services/users.service';
import { Role } from '@prisma/client';

export class UsersController {
  constructor(private usersService: UsersService = new UsersService()) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const { role, unitId } = req.query;

    const users = await this.usersService.listUsers({
      role: role ? (role as Role) : undefined,
      unitId: unitId ? String(unitId) : undefined,
    });

    res.json(users);
  };
}
