import { Router } from 'express';
import { Role } from '@prisma/client';
import {
  listProjects, createProject, getProject, updateProject, deleteProject,
  addProjectMember, removeProjectMember, getDashboardStats,
} from '../controllers/projects.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { validate } from '../validators/validate';
import {
  createProjectSchema, updateProjectSchema, addProjectMemberSchema,
} from '../validators/schemas';

const router = Router();

router.use(authenticate);

// Dashboard stats — all roles (content is role-differentiated in controller)
router.get('/dashboard/stats', getDashboardStats);

// Project CRUD
router.get('/', listProjects);
router.post('/', requireRole(Role.ADMIN, Role.PROJECT_MANAGER), validate(createProjectSchema), createProject);
router.get('/:id', getProject);
router.patch('/:id', requireRole(Role.ADMIN, Role.PROJECT_MANAGER), validate(updateProjectSchema), updateProject);
router.delete('/:id', requireRole(Role.ADMIN, Role.PROJECT_MANAGER), deleteProject);

// Member management — Admin + PM
router.post('/:id/members', requireRole(Role.ADMIN, Role.PROJECT_MANAGER), validate(addProjectMemberSchema), addProjectMember);
router.delete('/:id/members/:userId', requireRole(Role.ADMIN, Role.PROJECT_MANAGER), removeProjectMember);

export default router;
