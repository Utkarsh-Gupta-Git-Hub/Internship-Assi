import { Request, Response } from 'express';
import { Role } from '@prisma/client';
import { prisma } from '../config/prisma';
import { sendSuccess } from '../utils/response';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { asyncHandler } from '../middleware/error.middleware';

function buildProjectWhere(user: NonNullable<Request['user']>) {
  if (user.role === Role.ADMIN) return {};
  if (user.role === Role.PROJECT_MANAGER) return { createdBy: user.userId };
  // Developer — projects they are members of
  return { members: { some: { userId: user.userId } } };
}

/**
 * GET /api/projects
 * Admin: all projects | PM: their projects only | Dev: their member projects.
 */
export const listProjects = asyncHandler(async (req: Request, res: Response) => {
  const where = buildProjectWhere(req.user!);
  const projects = await prisma.project.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      client: { select: { id: true, name: true, company: true } },
      manager: { select: { id: true, name: true, email: true } },
      _count: { select: { tasks: true, members: true } },
    },
  });
  sendSuccess(res, projects);
});

/**
 * POST /api/projects
 * Admin + PM can create projects. PM's createdBy is automatically set to themselves.
 */
export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await prisma.project.create({
    data: { ...req.body, createdBy: req.user!.userId },
    include: {
      client: { select: { id: true, name: true, company: true } },
      manager: { select: { id: true, name: true } },
    },
  });
  sendSuccess(res, project, 'Project created', 201);
});

/**
 * GET /api/projects/:id
 * Role-scoped — PM can only access their own projects.
 */
export const getProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await prisma.project.findUnique({
    where: { id: req.params.id },
    include: {
      client: true,
      manager: { select: { id: true, name: true, email: true } },
      members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
      _count: { select: { tasks: true } },
    },
  });

  if (!project) throw new NotFoundError('Project');

  // RBAC: PM can only see their own projects
  if (req.user!.role === Role.PROJECT_MANAGER && project.createdBy !== req.user!.userId) {
    throw new ForbiddenError();
  }

  // RBAC: Developer can only see projects they are a member of
  if (req.user!.role === Role.DEVELOPER) {
    const isMember = project.members.some((m) => m.userId === req.user!.userId);
    if (!isMember) throw new ForbiddenError();
  }

  sendSuccess(res, project);
});

/**
 * PATCH /api/projects/:id
 */
export const updateProject = asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.project.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new NotFoundError('Project');

  if (req.user!.role === Role.PROJECT_MANAGER && existing.createdBy !== req.user!.userId) {
    throw new ForbiddenError();
  }

  const project = await prisma.project.update({
    where: { id: req.params.id },
    data: req.body,
  });
  sendSuccess(res, project, 'Project updated');
});

/**
 * DELETE /api/projects/:id
 */
export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.project.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new NotFoundError('Project');

  if (req.user!.role === Role.PROJECT_MANAGER && existing.createdBy !== req.user!.userId) {
    throw new ForbiddenError();
  }

  await prisma.project.delete({ where: { id: req.params.id } });
  sendSuccess(res, null, 'Project deleted');
});

/**
 * POST /api/projects/:id/members
 */
export const addProjectMember = asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.project.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new NotFoundError('Project');

  if (req.user!.role === Role.PROJECT_MANAGER && existing.createdBy !== req.user!.userId) {
    throw new ForbiddenError();
  }

  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: req.params.id, userId: req.body.userId } },
    create: { projectId: req.params.id, userId: req.body.userId },
    update: {},
  });

  sendSuccess(res, null, 'Member added', 201);
});

/**
 * DELETE /api/projects/:id/members/:userId
 */
export const removeProjectMember = asyncHandler(async (req: Request, res: Response) => {
  await prisma.projectMember.delete({
    where: { projectId_userId: { projectId: req.params.id, userId: req.params.userId } },
  });
  sendSuccess(res, null, 'Member removed');
});

/**
 * GET /api/projects/dashboard/stats
 * Role-differentiated dashboard stats.
 */
export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;

  if (user.role === Role.ADMIN) {
    const [totalProjects, tasksByStatus, overdueCount, onlineUsers] = await Promise.all([
      prisma.project.count(),
      prisma.task.groupBy({ by: ['status'], _count: { status: true } }),
      prisma.task.count({ where: { isOverdue: true } }),
      prisma.user.count({ where: { isOnline: true } }),
    ]);
    sendSuccess(res, { totalProjects, tasksByStatus, overdueCount, onlineUsers });

  } else if (user.role === Role.PROJECT_MANAGER) {
    const [myProjects, tasksByPriority, upcomingTasks] = await Promise.all([
      prisma.project.count({ where: { createdBy: user.userId } }),
      prisma.task.groupBy({
        by: ['priority'],
        _count: { priority: true },
        where: { project: { createdBy: user.userId } },
      }),
      prisma.task.findMany({
        where: {
          project: { createdBy: user.userId },
          dueDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
          status: { not: 'DONE' },
        },
        orderBy: { dueDate: 'asc' },
        take: 5,
        include: { assignee: { select: { name: true } }, project: { select: { name: true } } },
      }),
    ]);
    sendSuccess(res, { myProjects, tasksByPriority, upcomingTasks });

  } else {
    // Developer
    const myTasks = await prisma.task.findMany({
      where: { assignedTo: user.userId, status: { not: 'DONE' } },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
      include: { project: { select: { id: true, name: true } } },
    });
    sendSuccess(res, { myTasks });
  }
});
