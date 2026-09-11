import { Router } from 'express';
import { Role } from '@prisma/client';
import {
  listClients, createClient, getClient, updateClient, deleteClient,
} from '../controllers/clients.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { validate } from '../validators/validate';
import { createClientSchema, updateClientSchema } from '../validators/schemas';

const router = Router();

router.use(authenticate);
router.use(requireRole(Role.ADMIN)); // All client routes are Admin-only

router.get('/', listClients);
router.post('/', validate(createClientSchema), createClient);
router.get('/:id', getClient);
router.patch('/:id', validate(updateClientSchema), updateClient);
router.delete('/:id', deleteClient);

export default router;
