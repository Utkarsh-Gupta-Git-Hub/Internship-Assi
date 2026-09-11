import { Router } from 'express';
import { getActivityFeed, getMissedActivity } from '../controllers/activity.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/', getActivityFeed);
router.get('/missed', getMissedActivity);

export default router;
