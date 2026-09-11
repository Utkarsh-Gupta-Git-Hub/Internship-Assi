import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { sendSuccess } from '../utils/response';
import { NotFoundError } from '../utils/errors';
import { asyncHandler } from '../middleware/error.middleware';

export const listClients = asyncHandler(async (req: Request, res: Response) => {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { projects: true } } },
  });
  sendSuccess(res, clients);
});

export const createClient = asyncHandler(async (req: Request, res: Response) => {
  const client = await prisma.client.create({
    data: { ...req.body, createdBy: req.user!.userId },
  });
  sendSuccess(res, client, 'Client created', 201);
});

export const getClient = asyncHandler(async (req: Request, res: Response) => {
  const client = await prisma.client.findUnique({
    where: { id: req.params.id },
    include: {
      projects: {
        include: { _count: { select: { tasks: true } } },
      },
    },
  });
  if (!client) throw new NotFoundError('Client');
  sendSuccess(res, client);
});

export const updateClient = asyncHandler(async (req: Request, res: Response) => {
  const client = await prisma.client.update({
    where: { id: req.params.id },
    data: req.body,
  });
  sendSuccess(res, client, 'Client updated');
});

export const deleteClient = asyncHandler(async (req: Request, res: Response) => {
  await prisma.client.delete({ where: { id: req.params.id } });
  sendSuccess(res, null, 'Client deleted');
});
