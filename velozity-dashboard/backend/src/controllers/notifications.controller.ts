import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../middleware/error.middleware';

/**
 * GET /api/notifications
 * Returns notifications for the current user, ordered by newest first.
 */
export const listNotifications = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const page = parseInt(req.query.page as string || '1', 10);
  const limit = parseInt(req.query.limit as string || '20', 10);
  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: { task: { select: { id: true, title: true, projectId: true } } },
    }),
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);

  sendSuccess(res, notifications, 'Notifications retrieved', 200, { total, unreadCount, page, limit });
});

/**
 * PATCH /api/notifications/read
 * Mark one or all notifications as read.
 * Body: { notificationId: string } | { all: true }
 */
export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { notificationId, all } = req.body as { notificationId?: string; all?: boolean };

  if (all) {
    await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
    sendSuccess(res, null, 'All notifications marked as read');
    return;
  }

  if (notificationId) {
    await prisma.notification.update({
      where: { id: notificationId, userId },
      data: { read: true },
    });
    sendSuccess(res, null, 'Notification marked as read');
    return;
  }

  sendSuccess(res, null, 'No changes made');
});

/**
 * GET /api/notifications/count
 * Returns only the unread count — used for badge updates.
 */
export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  const count = await prisma.notification.count({
    where: { userId: req.user!.userId, read: false },
  });
  sendSuccess(res, { count });
});
