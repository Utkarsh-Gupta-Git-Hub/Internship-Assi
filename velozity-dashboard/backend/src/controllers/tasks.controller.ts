import { Request, Response } from 'express';
import { Role, TaskStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { sendSuccess } from '../utils/response';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { asyncHandler } from '../middleware/error.middleware';
import { emitActivityEvent, emitNotification } from '../socket/socket.manager';

async function assertProjectAccess(projectId: string, user: NonNullable<Request['user']>) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: { select: { userId: true } } },
  });
  if (!project) throw new NotFoundError('Project');

  if (user.role === Role.PROJECT_MANAGER && project.createdBy !== user.userId) {
    throw new ForbiddenError();
  }
  if (user.role === Role.DEVELOPER) {
    const isMember = project.members.some((m) => m.userId === user.userId);
    if (!isMember) throw new ForbiddenError();
  }

  return project;
}

/**
 * GET /api/projects/:projectId/tasks
 * Developers only see tasks assigned to them within the project.
 * All results support filtering via query params (shareable URLs).
 */
export const listTasks = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const user = req.user!;

  await assertProjectAccess(projectId, user);

  const { status, priority, dueDateFrom, dueDateTo, page = 1, limit = 50 } = req.query as {
    status?: TaskStatus;
    priority?: string;
    dueDateFrom?: string;
    dueDateTo?: string;
    page?: number;
    limit?: number;
  };

  const where: Record<string, unknown> = { projectId };

  // Developer: only their tasks
  if (user.role === Role.DEVELOPER) where.assignedTo = user.userId;

  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (dueDateFrom || dueDateTo) {
    where.dueDate = {
      ...(dueDateFrom ? { gte: new Date(dueDateFrom) } : {}),
      ...(dueDateTo ? { lte: new Date(dueDateTo) } : {}),
    };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } },
        _count: { select: { activityLogs: true } },
      },
    }),
    prisma.task.count({ where }),
  ]);

  sendSuccess(res, tasks, 'Tasks retrieved', 200, { total, page, limit });
});

/**
 * POST /api/projects/:projectId/tasks
 * Creates task, logs activity, sends notification to assigned developer.
 */
export const createTask = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  await assertProjectAccess(projectId, req.user!);

  const task = await prisma.task.create({
    data: { ...req.body, projectId, createdBy: req.user!.userId },
    include: {
      assignee: { select: { id: true, name: true } },
      project: { select: { name: true } },
    },
  });

  // Activity log
  await prisma.activityLog.create({
    data: {
      taskId: task.id,
      projectId,
      userId: req.user!.userId,
      action: 'created',
      toStatus: task.status,
      metadata: { taskTitle: task.title, userName: req.user!.name },
    },
  });

  // Notify assigned developer
  if (task.assignedTo) {
    const notification = await prisma.notification.create({
      data: {
        userId: task.assignedTo,
        title: 'New task assigned',
        message: `You have been assigned "${task.title}" in ${task.project.name}`,
        taskId: task.id,
      },
    });
    emitNotification(task.assignedTo, notification);
  }

  sendSuccess(res, task, 'Task created', 201);
});

/**
 * GET /api/projects/:projectId/tasks/:id
 */
export const getTask = asyncHandler(async (req: Request, res: Response) => {
  const { projectId, id } = req.params;
  await assertProjectAccess(projectId, req.user!);

  const task = await prisma.task.findFirst({
    where: { id, projectId },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true } },
      activityLogs: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });

  if (!task) throw new NotFoundError('Task');

  // Developer can only see tasks assigned to them
  if (req.user!.role === Role.DEVELOPER && task.assignedTo !== req.user!.userId) {
    throw new ForbiddenError();
  }

  sendSuccess(res, task);
});

/**
 * PATCH /api/projects/:projectId/tasks/:id/status
 * The primary real-time trigger — status changes emit to Socket.io rooms.
 */
export const updateTaskStatus = asyncHandler(async (req: Request, res: Response) => {
  const { projectId, id } = req.params;
  const { status } = req.body as { status: TaskStatus };
  await assertProjectAccess(projectId, req.user!);

  const task = await prisma.task.findFirst({ where: { id, projectId } });
  if (!task) throw new NotFoundError('Task');

  // Developer can only update their own tasks
  if (req.user!.role === Role.DEVELOPER && task.assignedTo !== req.user!.userId) {
    throw new ForbiddenError();
  }

  const prevStatus = task.status;
  const updatedTask = await prisma.task.update({
    where: { id },
    data: {
      status,
      isOverdue: status === TaskStatus.DONE ? false : task.isOverdue,
      updatedAt: new Date(),
    },
    include: {
      assignee: { select: { id: true, name: true } },
      project: { select: { id: true, name: true, createdBy: true } },
    },
  });

  // Store activity log in DB (not derived, not in-memory)
  const activityLog = await prisma.activityLog.create({
    data: {
      taskId: id,
      projectId,
      userId: req.user!.userId,
      action: 'moved',
      fromStatus: prevStatus,
      toStatus: status,
      metadata: { taskTitle: task.title, userName: req.user!.name },
    },
    include: { user: { select: { id: true, name: true } } },
  });

  // Emit to Socket.io rooms (real-time feed)
  emitActivityEvent(projectId, {
    id: activityLog.id,
    taskId: id,
    projectId,
    taskTitle: task.title,
    userName: req.user!.name,
    userId: req.user!.userId,
    action: 'moved',
    fromStatus: prevStatus,
    toStatus: status,
    assignedTo: task.assignedTo,
    createdAt: activityLog.createdAt,
  });

  // Notify PM when task moves to IN_REVIEW
  if (status === TaskStatus.IN_REVIEW) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (project) {
      const notification = await prisma.notification.create({
        data: {
          userId: project.createdBy,
          title: 'Task ready for review',
          message: `"${task.title}" has been moved to In Review by ${req.user!.name}`,
          taskId: id,
        },
      });
      emitNotification(project.createdBy, notification);
    }
  }

  sendSuccess(res, updatedTask, 'Task status updated');
});

/**
 * PATCH /api/projects/:projectId/tasks/:id
 * General task update (title, description, priority, due date, assignee).
 */
export const updateTask = asyncHandler(async (req: Request, res: Response) => {
  const { projectId, id } = req.params;
  await assertProjectAccess(projectId, req.user!);

  const task = await prisma.task.findFirst({ where: { id, projectId } });
  if (!task) throw new NotFoundError('Task');

  const prevAssignee = task.assignedTo;
  const updatedTask = await prisma.task.update({
    where: { id },
    data: req.body,
    include: { assignee: { select: { id: true, name: true } }, project: { select: { name: true } } },
  });

  // Log the update
  await prisma.activityLog.create({
    data: {
      taskId: id,
      projectId,
      userId: req.user!.userId,
      action: 'updated',
      metadata: { taskTitle: task.title, userName: req.user!.name, changes: req.body },
    },
  });

  // Notify new assignee
  if (req.body.assignedTo && req.body.assignedTo !== prevAssignee) {
    const notification = await prisma.notification.create({
      data: {
        userId: req.body.assignedTo,
        title: 'New task assigned',
        message: `You have been assigned "${task.title}" in ${updatedTask.project.name}`,
        taskId: id,
      },
    });
    emitNotification(req.body.assignedTo, notification);
  }

  sendSuccess(res, updatedTask, 'Task updated');
});

/**
 * DELETE /api/projects/:projectId/tasks/:id
 */
export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
  const { projectId, id } = req.params;
  await assertProjectAccess(projectId, req.user!);

  const task = await prisma.task.findFirst({ where: { id, projectId } });
  if (!task) throw new NotFoundError('Task');

  await prisma.task.delete({ where: { id } });
  sendSuccess(res, null, 'Task deleted');
});

/**
 * GET /api/projects/:projectId/tasks/:id/activity
 * Returns the per-task activity log (stored in DB, not derived).
 */
export const getTaskActivity = asyncHandler(async (req: Request, res: Response) => {
  const { projectId, id } = req.params;
  await assertProjectAccess(projectId, req.user!);

  const logs = await prisma.activityLog.findMany({
    where: { taskId: id, projectId },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { user: { select: { id: true, name: true } } },
  });

  sendSuccess(res, logs);
});
