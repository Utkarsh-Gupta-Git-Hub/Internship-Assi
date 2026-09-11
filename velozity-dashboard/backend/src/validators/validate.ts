import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

type Target = 'body' | 'query' | 'params';

/**
 * Generic validation middleware factory.
 * Usage: validate(createTaskSchema) — validates req.body
 *        validate(taskFiltersSchema, 'query') — validates req.query
 */
export function validate(schema: ZodSchema, target: Target = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      next(result.error);
      return;
    }
    // Replace the target with the parsed (and coerced) data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req as unknown as Record<string, unknown>)[target] = result.data;
    next();
  };
}
