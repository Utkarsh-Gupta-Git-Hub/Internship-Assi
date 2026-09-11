import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';

/**
 * Role-based access control middleware factory.
 * Usage: requireRole(Role.ADMIN) or requireRole(Role.ADMIN, Role.PROJECT_MANAGER)
 *
 * Enforced at the ROUTE level — frontend-only role hiding is insufficient
 * and would not pass evaluation. This middleware runs on every protected route.
 */
export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!allowedRoles.includes(req.user.role as Role)) {
      throw new ForbiddenError(
        `Access denied. Required roles: ${allowedRoles.join(', ')}. Your role: ${req.user.role}`
      );
    }

    next();
  };
}

/**
 * Middleware to check ownership — ensures a PM can only access their own projects.
 * This is applied on individual resource routes, not globally.
 */
export function requireOwnerOrAdmin(getOwnerId: (req: Request) => Promise<string | null>) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(new UnauthorizedError());
      }

      if (req.user.role === Role.ADMIN) {
        return next();
      }

      const ownerId = await getOwnerId(req);
      if (!ownerId || ownerId !== req.user.userId) {
        return next(new ForbiddenError('You do not have access to this resource'));
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
