import { Response } from 'express';
import { NotificationService } from './notification.service';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';

const getMyNotifications = catchAsync(async (req: any, res: Response) => {
  const userId = req.user.id;

  const result = await NotificationService.getMyNotifications(userId);

  sendResponse(res, {
    success: true,
    message: 'Notifications fetched',
    data: result,
  });
});

const markAsRead = catchAsync(async (req: any, res: Response) => {
  const userId = req.user.id;
  const { id } = req.params;

  const result = await NotificationService.markAsRead(id, userId);

  sendResponse(res, {
    success: true,
    message: 'Notification marked as read',
    data: result,
  });
});

export const NotificationController = {
  getMyNotifications,
  markAsRead,
};