import express from 'express';
import { authenticate } from '../../middleware/auth';
import { NotificationController } from './notification.controllter';

const router = express.Router();

router.get(
  '/',
  authenticate,
  NotificationController.getMyNotifications
);

router.patch(
  '/:id/read',
  authenticate,
  NotificationController.markAsRead
);

export const NotificationRoutes = router;