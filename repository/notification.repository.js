import Notification from '../models/Notification.js';

class NotificationRepository {
  /**
   * Create a new notification
   */
  async createNotification(notificationData) {
    try {
      const notification = new Notification(notificationData);
      return await notification.save();
    } catch (error) {
      throw new Error(`Failed to create notification: ${error.message}`);
    }
  }

  /**
   * Get all notifications for a user (excluding deleted)
   */
  async getUserNotifications(userId, limit = 50, skip = 0) {
    try {
      return await Notification.find({
        userId,
        isDeleted: false
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);
    } catch (error) {
      throw new Error(`Failed to get user notifications: ${error.message}`);
    }
  }

  /**
   * Get unread notifications count for a user
   */
  async getUnreadCount(userId) {
    try {
      return await Notification.countDocuments({
        userId,
        isRead: false,
        isDeleted: false
      });
    } catch (error) {
      throw new Error(`Failed to get unread count: ${error.message}`);
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    try {
      return await Notification.findOneAndUpdate(
        { _id: notificationId, userId, isDeleted: false },
        { isRead: true },
        { new: true }
      );
    } catch (error) {
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId) {
    try {
      return await Notification.updateMany(
        { userId, isDeleted: false },
        { isRead: true }
      );
    } catch (error) {
      throw new Error(`Failed to mark all notifications as read: ${error.message}`);
    }
  }

  /**
   * Delete a single notification (soft delete)
   */
  async deleteNotification(notificationId, userId) {
    try {
      return await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        { isDeleted: true },
        { new: true }
      );
    } catch (error) {
      throw new Error(`Failed to delete notification: ${error.message}`);
    }
  }

  /**
   * Delete all notifications for a user (soft delete)
   */
  async deleteAllUserNotifications(userId) {
    try {
      return await Notification.updateMany(
        { userId },
        { isDeleted: true }
      );
    } catch (error) {
      throw new Error(`Failed to delete all user notifications: ${error.message}`);
    }
  }

  /**
   * Get notification by ID and user
   */
  async getNotificationById(notificationId, userId) {
    try {
      return await Notification.findOne({
        _id: notificationId,
        userId,
        isDeleted: false
      });
    } catch (error) {
      throw new Error(`Failed to get notification: ${error.message}`);
    }
  }

  /**
   * Get notification by action hash and user
   */
  async getNotificationByActionHash(actionHash, userId) {
    try {
      return await Notification.findOne({
        actionHash,
        userId,
        isDeleted: false
      });
    } catch (error) {
      throw new Error(`Failed to get notification by action hash: ${error.message}`);
    }
  }

  /**
   * Update a notification
   */
  async updateNotification(notificationId, updateData) {
    try {
      return await Notification.findByIdAndUpdate(
        notificationId,
        updateData,
        { new: true }
      );
    } catch (error) {
      throw new Error(`Failed to update notification: ${error.message}`);
    }
  }

  /**
   * Get notifications with smart grouping
   */
  async getSmartUserNotifications(userId, limit = 50, skip = 0) {
    try {
      return await Notification.find({
        userId,
        isDeleted: false
      })
      .sort({ lastOccurrence: -1, createdAt: -1 })
      .limit(limit)
      .skip(skip);
    } catch (error) {
      throw new Error(`Failed to get smart user notifications: ${error.message}`);
    }
  }
}

export default new NotificationRepository();
