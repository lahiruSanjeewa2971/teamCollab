import notificationService from '../service/notification.service.js';
import AppError from '../utils/AppError.js';

/**
 * Get all notifications for the authenticated user
 */
export const getUserNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 50 } = req.query;
    
    const result = await notificationService.getSmartUserNotifications(userId, parseInt(page), parseInt(limit));
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.log('Error in getting user notifications: ', error);
    next(error);
  }
};

/**
 * Mark a notification as read
 */
export const markNotificationAsRead = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { notificationId } = req.params;
    
    const notification = await notificationService.markAsRead(notificationId, userId);
    
    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.log('Error in marking notification as read: ', error);
    next(error);
  }
};

/**
 * Mark all notifications as read for the authenticated user
 */
export const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    const result = await notificationService.markAllAsRead(userId);
    
    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      data: result
    });
  } catch (error) {
    console.log('Error in marking all notifications as read: ', error);
    next(error);
  }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { notificationId } = req.params;
    
    const notification = await notificationService.deleteNotification(notificationId, userId);
    
    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
      data: notification
    });
  } catch (error) {
    console.log('Error in deleting notification: ', error);
    next(error);
  }
};

/**
 * Delete all notifications for the authenticated user
 */
export const deleteAllNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    const result = await notificationService.deleteAllUserNotifications(userId);
    
    res.status(200).json({
      success: true,
      message: 'All notifications deleted successfully',
      data: result
    });
  } catch (error) {
    console.log('Error in deleting all notifications: ', error);
    next(error);
  }
};

/**
 * Get notification statistics for the authenticated user
 */
export const getNotificationStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    const stats = await notificationService.getNotificationStats(userId);
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.log('Error in getting notification stats: ', error);
    next(error);
  }
};
