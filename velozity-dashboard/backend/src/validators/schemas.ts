import { z } from 'zod';
import { Role, TaskStatus, Priority, ProjectStatus } from '@prisma/client';

// ─── Auth ───
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// ─── Users ───
export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  role: z.nativeEnum(Role),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  role: z.nativeEnum(Role).optional(),
});

// ─── Clients ───
export const createClientSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  company: z.string().min(2).max(200),
  phone: z.string().optional(),
});

export const updateClientSchema = createClientSchema.partial();

// ─── Projects ───
export const createProjectSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters').max(200),
  description: z.string().max(2000).optional(),
  clientId: z.string().uuid('Invalid client ID'),
  status: z.nativeEnum(ProjectStatus).optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export const addProjectMemberSchema = z.object({
  userId: z.string().uuid(),
});

// ─── Tasks ───
export const createTaskSchema = z.object({
  title: z.string().min(2, 'Task title must be at least 2 characters').max(500),
  description: z.string().max(5000).optional(),
  assignedTo: z.string().uuid('Invalid user ID').optional().nullable(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(Priority).optional(),
  dueDate: z.string().datetime().optional().nullable(),
});

export const updateTaskSchema = createTaskSchema.partial();

export const updateTaskStatusSchema = z.object({
  status: z.nativeEnum(TaskStatus, {
    errorMap: () => ({ message: `Status must be one of: ${Object.values(TaskStatus).join(', ')}` }),
  }),
});

// ─── Task filters (query params) ───
export const taskFiltersSchema = z.object({
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(Priority).optional(),
  dueDateFrom: z.string().datetime().optional(),
  dueDateTo: z.string().datetime().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

// ─── Notifications ───
export const markNotificationReadSchema = z.object({
  notificationId: z.string().uuid().optional(),
  all: z.boolean().optional(),
});
