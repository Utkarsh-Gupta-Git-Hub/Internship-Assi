import { Router } from 'express';
import { Role } from '@prisma/client';
import {
  listUsers, createUser, getUser, updateUser, deleteUser, listDevelopers,
} from '../controllers/users.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { validate } from '../validators/validate';
import { createUserSchema, updateUserSchema } from '../validators/schemas';

const router = Router();

// All users routes require authentication
router.use(authenticate);

// Developers list — accessible by Admin and PM (for task assignment)
router.get('/developers', requireRole(Role.ADMIN, Role.PROJECT_MANAGER), listDevelopers);

// All other user management — Admin only
router.get('/', requireRole(Role.ADMIN), listUsers);
router.post('/', requireRole(Role.ADMIN), validate(createUserSchema), createUser);
router.get('/:id', requireRole(Role.ADMIN), getUser);
router.patch('/:id', requireRole(Role.ADMIN), validate(updateUserSchema), updateUser);
router.delete('/:id', requireRole(Role.ADMIN), deleteUser);

export default router;
