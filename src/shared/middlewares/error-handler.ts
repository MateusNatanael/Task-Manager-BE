import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/app-error';

export function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      status: 'error',
      message: error.message,
      ...(error.details ? { details: error.details } : {}),
    });
    return;
  }

  if (error instanceof ZodError) {
    res.status(422).json({
      status: 'error',
      message: 'Validation error',
      issues: error.issues,
    });
    return;
  }

  console.error('💥 Unhandled Error:', error);

  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
}
