import notificationRepository from '../repository/notification.repository.js';

class NotificationService {
  /**
   * Create a notification for a user
   */
  async createNotification(userId, notificationData) {
    try {
      const notification = await notificationRepository.createNotification({
        userId,
        ...notificationData
      });
      return notification;
    } catch (error) {
      throw new Error(`Notification service error: ${error.message}`);
    }
  }

  /**
   * Get all notifications for a user
   */
  async getUserNotifications(userId, page = 1, limit = 50) {
    try {
      const skip = (page - 1) * limit;
      const notifications = await notificationRepository.getUserNotifications(userId, limit, skip);
      const unreadCount = await notificationRepository.getUnreadCount(userId);
      
      return {
        notifications,
        unreadCount,
        pagination: {
          page,
          limit,
          total: notifications.length,
          hasMore: notifications.length === limit
        }
      };
    } catch (error) {
      throw new Error(`Failed to get user notifications: ${error.message}`);
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    try {
      const notification = await notificationRepository.markAsRead(notificationId, userId);
      if (!notification) {
        throw new Error('Notification not found or access denied');
      }
      return notification;
    } catch (error) {
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId) {
    try {
      return await notificationRepository.markAllAsRead(userId);
    } catch (error) {
      throw new Error(`Failed to mark all notifications as read: ${error.message}`);
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId, userId) {
    try {
      const notification = await notificationRepository.deleteNotification(notificationId, userId);
      if (!notification) {
        throw new Error('Notification not found or access denied');
      }
      return notification;
    } catch (error) {
      throw new Error(`Failed to delete notification: ${error.message}`);
    }
  }

  /**
   * Delete all notifications for a user
   */
  async deleteAllUserNotifications(userId) {
    try {
      return await notificationRepository.deleteAllUserNotifications(userId);
    } catch (error) {
      throw new Error(`Failed to delete all user notifications: ${error.message}`);
    }
  }

  /**
   * Create team removal notification with duplicate prevention
   */
  async createTeamRemovalNotification(userId, teamId, teamName) {
    try {
      // Create a unique hash for this action
      const actionHash = `team_removal_${userId}_${teamId}`;
      
      // Check if notification already exists
      const existingNotification = await notificationRepository.getNotificationByActionHash(actionHash, userId);
      
      if (existingNotification) {
        // Update existing notification instead of creating duplicate
        return await this.updateTeamRemovalNotification(existingNotification._id, teamName);
      } else {
        // Create new notification
        return await this.createNotification(userId, {
          type: 'team_removal',
          title: 'Removed from Team',
          message: `You have been removed from '${teamName}'`,
          teamId,
          teamName,
          severity: 'warning',
          actionHash,
          occurrenceCount: 1,
          lastOccurrence: new Date()
        });
      }
    } catch (error) {
      throw new Error(`Failed to create team removal notification: ${error.message}`);
    }
  }

  /**
   * Update existing team removal notification (for repeated removals)
   */
  async updateTeamRemovalNotification(notificationId, teamName) {
    try {
      const updateData = {
        message: `You have been removed from '${teamName}'`,
        occurrenceCount: { $inc: 1 },
        lastOccurrence: new Date(),
        isRead: false, // Mark as unread since it's a new occurrence
        isResolved: false // Reset resolved status
      };
      
      return await notificationRepository.updateNotification(notificationId, updateData);
    } catch (error) {
      throw new Error(`Failed to update team removal notification: ${error.message}`);
    }
  }

  /**
   * Resolve a team removal notification (when user rejoins the team)
   */
  async resolveTeamRemovalNotification(userId, teamId) {
    try {
      const actionHash = `team_removal_${userId}_${teamId}`;
      const notification = await notificationRepository.getNotificationByActionHash(actionHash, userId);
      
      if (notification && !notification.isResolved) {
        return await notificationRepository.updateNotification(notification._id, {
          isResolved: true,
          resolvedAt: new Date()
        });
      }
      
      return notification;
    } catch (error) {
      throw new Error(`Failed to resolve team removal notification: ${error.message}`);
    }
  }

  /**
   * Get smart notifications for a user (grouped and deduplicated)
   */
  async getSmartUserNotifications(userId, page = 1, limit = 50) {
    try {
      const skip = (page - 1) * limit;
      const notifications = await notificationRepository.getUserNotifications(userId, limit, skip);
      const unreadCount = await notificationRepository.getUnreadCount(userId);
      
      // Process notifications for smart display
      const smartNotifications = notifications.map(notification => ({
        ...notification.toObject(),
        displayMessage: notification.smartMessage || notification.message,
        isRepeated: notification.occurrenceCount > 1
      }));
      
      return {
        notifications: smartNotifications,
        unreadCount,
        pagination: {
          page,
          limit,
          total: notifications.length,
          hasMore: notifications.length === limit
        }
      };
    } catch (error) {
      throw new Error(`Failed to get smart user notifications: ${error.message}`);
    }
  }

  /**
   * Get notification statistics for a user
   */
  async getNotificationStats(userId) {
    try {
      const unreadCount = await notificationRepository.getUnreadCount(userId);
      const totalNotifications = await notificationRepository.getUserNotifications(userId, 1, 0);
      
      return {
        unreadCount,
        totalCount: totalNotifications.length
      };
    } catch (error) {
      throw new Error(`Failed to get notification stats: ${error.message}`);
    }
  }
}

export default new NotificationService();
