import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';
import { config } from '../config/config';

/**
 * Global error handler — the last middleware in the chain.
 * Catches all errors thrown from controllers and middleware.
 *
 * Rules:
 * - Never expose raw stack traces to client
 * - Always return structured JSON: { success, message, data: { code } }
 * - Log full error details on the server side
 */
export function globalErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // Always log full error on server
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path}`, err);

  // Zod validation errors
  if (err instanceof ZodError) {
    const messages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
    res.status(422).json({
      success: false,
      message: 'Validation failed',
      data: {
        code: 'VALIDATION_ERROR',
        errors: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      },
    });
    return;
  }

  // Prisma errors
  if (err.constructor?.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as { code?: string; meta?: { target?: string[] } };
    if (prismaErr.code === 'P2002') {
      const field = prismaErr.meta?.target?.[0] || 'field';
      res.status(409).json({
        success: false,
        message: `A record with this ${field} already exists`,
        data: { code: 'CONFLICT' },
      });
      return;
    }
    if (prismaErr.code === 'P2025') {
      res.status(404).json({
        success: false,
        message: 'Record not found',
        data: { code: 'NOT_FOUND' },
      });
      return;
    }
  }

  // Our custom operational errors
  if (err instanceof AppError && err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      data: { code: err.code },
    });
    return;
  }

  // Unknown/unexpected errors — don't leak details in production
  res.status(500).json({
    success: false,
    message: config.nodeEnv === 'production' ? 'An unexpected error occurred' : err.message,
    data: { code: 'INTERNAL_ERROR' },
  });
}

/**
 * Wraps async route handlers to automatically catch rejected promises
 * and forward to next(err) — avoids try/catch boilerplate in every controller.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
