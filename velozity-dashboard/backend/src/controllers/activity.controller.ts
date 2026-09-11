import { Request, Response } from 'express';
import { Role } from '@prisma/client';
import { prisma } from '../config/prisma';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';

/**
 * GET /api/activity
 * Role-filtered activity feed — fetched from DB, not cached in memory.
 * Admin: all projects | PM: their projects | Dev: tasks assigned to them.
 */
export const getActivityFeed = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const limit = Math.min(parseInt(req.query.limit as string || '20', 10), 100);
  const cursor = req.query.cursor as string | undefined;

  let where: Record<string, unknown> = {};

  if (user.role === Role.PROJECT_MANAGER) {
    where = { project: { createdBy: user.userId } };
  } else if (user.role === Role.DEVELOPER) {
    where = { task: { assignedTo: user.userId } };
  }
  // Admin: no where filter = all activity

  const logs = await prisma.activityLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      user: { select: { id: true, name: true } },
      task: { select: { id: true, title: true } },
      project: { select: { id: true, name: true } },
    },
  });

  const nextCursor = logs.length === limit ? logs[logs.length - 1]?.id : null;
  sendSuccess(res, logs, 'Activity feed retrieved', 200, { nextCursor });
});

/**
 * GET /api/activity/missed?since=<ISO date>
 * Fetches missed events since the user was last online (up to 20).
 * Called by Socket.io on reconnect.
 */
export const getMissedActivity = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const since = req.query.since ? new Date(req.query.since as string) : new Date(Date.now() - 24 * 60 * 60 * 1000);

  let where: Record<string, unknown> = { createdAt: { gte: since } };

  if (user.role === Role.PROJECT_MANAGER) {
    where = { ...where, project: { createdBy: user.userId } };
  } else if (user.role === Role.DEVELOPER) {
    where = { ...where, task: { assignedTo: user.userId } };
  }

  const logs = await prisma.activityLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 20, // Spec: last 20 missed events
    include: {
      user: { select: { id: true, name: true } },
      task: { select: { id: true, title: true } },
      project: { select: { id: true, name: true } },
    },
  });

  sendSuccess(res, logs, 'Missed activity retrieved');
});
