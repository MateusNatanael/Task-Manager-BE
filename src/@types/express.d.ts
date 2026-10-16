import { Role } from '@prisma/client';

export interface TokenPayload {
  id: string;
  role: Role;
  unitId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}
