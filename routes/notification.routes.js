import express from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
  getNotificationStats
} from '../controllers/notification.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get user notifications
router.get('/', getUserNotifications);

// Get notification statistics
router.get('/stats', getNotificationStats);

// Mark notification as read
router.patch('/:notificationId/read', markNotificationAsRead);

// Mark all notifications as read
router.patch('/mark-all-read', markAllNotificationsAsRead);

// Delete a notification
router.delete('/:notificationId', deleteNotification);

// Delete all notifications
router.delete('/', deleteAllNotifications);

export default router;
