import { Router } from 'express';
import { listNotifications, markAsRead, getUnreadCount } from '../controllers/notifications.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../validators/validate';
import { markNotificationReadSchema } from '../validators/schemas';

const router = Router();
router.use(authenticate);

router.get('/', listNotifications);
router.get('/count', getUnreadCount);
router.patch('/read', validate(markNotificationReadSchema), markAsRead);

export default router;
