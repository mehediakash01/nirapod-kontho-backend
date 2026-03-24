import { prisma } from "../../config/prisma";
import { AppError } from '../../errors/AppError';


const createNotification = async (userId: string, message: string) => {
  return prisma.notification.create({
    data: {
      userId,
      message,
    },
  });
};

const getMyNotifications = async (userId: string) => {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
};

const markAsRead = async (id: string, userId: string) => {
  // Verify ownership: can only mark own notifications as read
  const notification = await prisma.notification.findUnique({
    where: { id },
  });

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  if (notification.userId !== userId) {
    throw new AppError('Cannot update notification of another user', 403);
  }

  return prisma.notification.update({
    where: { id },
    data: {
      isRead: true,
    },
  });
};

// Helper to build notification messages consistently
const buildVerificationMessage = (status: 'APPROVED' | 'REJECTED'): string => {
  return status === 'APPROVED'
    ? 'Your report has been verified and a case has been created.'
    : 'Your report has been rejected.';
};

export const NotificationService = {
  createNotification,
  getMyNotifications,
  markAsRead,
  buildVerificationMessage,
};