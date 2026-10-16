import { Request, Response, NextFunction } from 'express';
import { ZodType } from 'zod';

export function validateBody(schema: ZodType) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function validateQuery(schema: ZodType) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync(req.query);
      req.query = parsed as typeof req.query;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function validateParams(schema: ZodType) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync(req.params);
      req.params = parsed as typeof req.params;
      next();
    } catch (error) {
      next(error);
    }
  };
}
