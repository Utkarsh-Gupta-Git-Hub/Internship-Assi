import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { sendSuccess } from '../utils/response';
import { NotFoundError } from '../utils/errors';
import { asyncHandler } from '../middleware/error.middleware';

/**
 * GET /api/users
 * Admin only — list all users with pagination.
 */
export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string || '1', 10);
  const limit = parseInt(req.query.limit as string || '20', 10);
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, email: true, name: true, role: true,
        isOnline: true, lastSeen: true, createdAt: true,
        _count: { select: { assignedTasks: true } },
      },
    }),
    prisma.user.count(),
  ]);

  sendSuccess(res, users, 'Users retrieved', 200, { total, page, limit });
});

/**
 * POST /api/users
 * Admin only — create a new user.
 */
export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name, role } = req.body;

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, passwordHash, name, role },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  sendSuccess(res, user, 'User created', 201);
});

/**
 * GET /api/users/:id
 * Admin only — get single user.
 */
export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, email: true, name: true, role: true,
      isOnline: true, lastSeen: true, createdAt: true,
      _count: { select: { assignedTasks: true, managedProjects: true } },
    },
  });

  if (!user) throw new NotFoundError('User');
  sendSuccess(res, user);
});

/**
 * PATCH /api/users/:id
 * Admin only — update user details.
 */
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data: Record<string, unknown> = { ...req.body };

  if (data.password) {
    data.passwordHash = await bcrypt.hash(data.password as string, 12);
    delete data.password;
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, email: true, name: true, role: true },
  });

  sendSuccess(res, user, 'User updated');
});

/**
 * DELETE /api/users/:id
 * Admin only — delete user.
 */
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.user.delete({ where: { id } });
  sendSuccess(res, null, 'User deleted');
});

/**
 * GET /api/users/developers
 * Admin + PM — list users with DEVELOPER role (for task assignment dropdown).
 */
export const listDevelopers = asyncHandler(async (_req: Request, res: Response) => {
  const developers = await prisma.user.findMany({
    where: { role: 'DEVELOPER' },
    select: { id: true, name: true, email: true, isOnline: true },
    orderBy: { name: 'asc' },
  });
  sendSuccess(res, developers);
});
