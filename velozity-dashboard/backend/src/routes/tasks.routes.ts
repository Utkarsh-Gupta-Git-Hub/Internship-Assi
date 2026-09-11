import { Router } from 'express';
import { Role } from '@prisma/client';
import {
  listTasks, createTask, getTask, updateTaskStatus, updateTask, deleteTask, getTaskActivity,
} from '../controllers/tasks.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { validate } from '../validators/validate';
import {
  createTaskSchema, updateTaskSchema, updateTaskStatusSchema, taskFiltersSchema,
} from '../validators/schemas';

const router = Router({ mergeParams: true }); // Merges :projectId from parent

router.use(authenticate);

router.get('/', validate(taskFiltersSchema, 'query'), listTasks);
router.post('/', requireRole(Role.ADMIN, Role.PROJECT_MANAGER), validate(createTaskSchema), createTask);
router.get('/:id', getTask);
router.patch('/:id/status', validate(updateTaskStatusSchema), updateTaskStatus);
router.patch('/:id', requireRole(Role.ADMIN, Role.PROJECT_MANAGER), validate(updateTaskSchema), updateTask);
router.delete('/:id', requireRole(Role.ADMIN, Role.PROJECT_MANAGER), deleteTask);
router.get('/:id/activity', getTaskActivity);

export default router;
