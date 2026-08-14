import { Router } from 'express';
import { USER_ROLE } from '../user/user.constant';
import { getAllNotifications, markAllAsRead } from './notification.controller';
import { auth, authenticate } from '../../middleware/auth';

const router = Router();

router.get('/', authenticate, auth(USER_ROLE.ADMIN), getAllNotifications);
router.patch('/read/all', markAllAsRead);

const notificationRouter = router;
export default notificationRouter;
