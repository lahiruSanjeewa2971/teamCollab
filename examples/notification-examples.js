/**
 * Example Usage of NotificationService
 * 
 * This file demonstrates how to use the new scalable NotificationService
 * for various team-related events. Copy these patterns to your controllers.
 */

import { NotificationService } from '../server.js';

/**
 * Example: Team Creation Event
 * Notify all team members when a new team is created
 */
export const handleTeamCreation = async (teamId, teamName, creatorId) => {
  try {
    // Notify team members about new team
    await NotificationService.notifyTeamCreation(teamId, teamName, creatorId);
    
    // You can also notify specific users
    NotificationService.notifyUser(creatorId, 'team:created-success', {
      teamId,
      teamName,
      message: `Team '${teamName}' created successfully!`
    });
    
  } catch (error) {
    console.error('Failed to send team creation notifications:', error);
  }
};

/**
 * Example: Member Join Event
 * Notify existing team members when someone joins
 */
export const handleMemberJoined = async (teamId, teamName, newMemberId, newMemberName) => {
  try {
    // Notify existing team members
    await NotificationService.notifyMemberJoined(teamId, teamName, newMemberId, newMemberName);
    
    // Welcome the new member
    NotificationService.notifyUser(newMemberId, 'team:welcome', {
      teamId,
      teamName,
      message: `Welcome to '${teamName}'!`
    });
    
  } catch (error) {
    console.error('Failed to send member join notifications:', error);
  }
};

/**
 * Example: Team Update Event
 * Notify team members when team details change
 */
export const handleTeamUpdate = async (teamId, teamName, updatedFields, updaterId) => {
  try {
    // Notify team members about updates
    await NotificationService.notifyTeamUpdate(teamId, teamName, updatedFields, updaterId);
    
    // Notify the updater about success
    NotificationService.notifyUser(updaterId, 'team:update-success', {
      teamId,
      teamName,
      message: `Team '${teamName}' updated successfully!`
    });
    
  } catch (error) {
    console.error('Failed to send team update notifications:', error);
  }
};

/**
 * Example: Team Deletion Event
 * Notify all team members when team is deleted
 */
export const handleTeamDeletion = async (teamId, teamName, memberIds) => {
  try {
    const payload = {
      teamId,
      teamName,
      message: `Team '${teamName}' has been deleted`,
      timestamp: new Date().toISOString(),
      type: 'team_deleted'
    };
    
    // Notify all team members
    NotificationService.notifyUsers(memberIds, 'team:deleted', payload);
    
  } catch (error) {
    console.error('Failed to send team deletion notifications:', error);
  }
};

/**
 * Example: Custom Event with Filtering
 * Send different notifications based on user role
 */
export const handleCustomTeamEvent = async (teamId, teamName, eventData) => {
  try {
    // Get team details to determine member roles
    const { findTeamById } = await import('../repository/team.repository.js');
    const team = await findTeamById(teamId);
    
    if (!team) return;
    
    // Separate members by role
    const owners = team.members.filter(member => 
      member._id.toString() === team.owner.toString()
    ).map(member => member._id);
    
    const regularMembers = team.members.filter(member => 
      member._id.toString() !== team.owner.toString()
    ).map(member => member._id);
    
    // Send different notifications based on role
    if (owners.length > 0) {
      NotificationService.notifyUsers(owners, 'team:admin-notification', {
        teamId,
        teamName,
        message: `Admin notification: ${eventData.message}`,
        priority: 'high',
        requiresAction: true
      });
    }
    
    if (regularMembers.length > 0) {
      NotificationService.notifyUsers(regularMembers, 'team:member-notification', {
        teamId,
        teamName,
        message: `Member notification: ${eventData.message}`,
        priority: 'normal',
        requiresAction: false
      });
    }
    
  } catch (error) {
    console.error('Failed to send custom team notifications:', error);
  }
};

/**
 * Example: Bulk Notifications
 * Send notifications to multiple teams at once
 */
export const handleBulkNotification = async (teamIds, eventType, message) => {
  try {
    const payload = {
      message,
      timestamp: new Date().toISOString(),
      type: eventType,
      affectedTeams: teamIds.length
    };
    
    // Get all unique users from all teams
    const { findTeamsByIds } = await import('../repository/team.repository.js');
    const teams = await findTeamsByIds(teamIds);
    
    if (!teams || teams.length === 0) return;
    
    // Collect all unique user IDs
    const allUserIds = new Set();
    teams.forEach(team => {
      if (team.members) {
        team.members.forEach(member => {
          allUserIds.add(member._id.toString());
        });
      }
    });
    
    // Send bulk notification
    const userIds = Array.from(allUserIds);
    NotificationService.notifyUsers(userIds, 'system:bulk-notification', payload);
    
    console.log(`Bulk notification sent to ${userIds.length} users across ${teams.length} teams`);
    
  } catch (error) {
    console.error('Failed to send bulk notifications:', error);
  }
};

/**
 * Example: Scheduled Notifications
 * Send notifications at specific times or intervals
 */
export const handleScheduledNotification = async (teamId, teamName, scheduledTime) => {
  try {
    // This would typically be called by a cron job or scheduler
    const payload = {
      teamId,
      teamName,
      message: `Scheduled reminder for team '${teamName}'`,
      scheduledTime,
      timestamp: new Date().toISOString(),
      type: 'scheduled_reminder'
    };
    
    // Get team members
    const { findTeamById } = await import('../repository/team.repository.js');
    const team = await findTeamById(teamId);
    
    if (!team || !team.members) return;
    
    const memberIds = team.members.map(member => member._id);
    NotificationService.notifyUsers(memberIds, 'team:scheduled-reminder', payload);
    
  } catch (error) {
    console.error('Failed to send scheduled notifications:', error);
  }
};

/**
 * Example: Error Handling and Retry Logic
 * Robust notification with fallback options
 */
export const handleRobustNotification = async (teamId, eventName, payload, maxRetries = 3) => {
  let retryCount = 0;
  
  const attemptNotification = async () => {
    try {
      await NotificationService.notifyTeamMembers(teamId, eventName, payload);
      console.log(`Notification sent successfully: ${eventName}`);
      return true;
    } catch (error) {
      retryCount++;
      console.error(`Notification attempt ${retryCount} failed:`, error);
      
      if (retryCount < maxRetries) {
        // Exponential backoff
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`Retrying in ${delay}ms...`);
        
        setTimeout(() => {
          attemptNotification();
        }, delay);
      } else {
        console.error(`Notification failed after ${maxRetries} attempts`);
        
        // Fallback: store in database for later delivery
        await storeFailedNotification(teamId, eventName, payload);
      }
      
      return false;
    }
  };
  
  return attemptNotification();
};

/**
 * Helper function to store failed notifications
 */
const storeFailedNotification = async (teamId, eventName, payload) => {
  try {
    // This would typically store in a database or queue
    console.log(`Storing failed notification for later delivery: ${eventName}`);
    // await NotificationQueue.create({ teamId, eventName, payload, retryCount: 0 });
  } catch (error) {
    console.error('Failed to store notification for retry:', error);
  }
};

export default {
  handleTeamCreation,
  handleMemberJoined,
  handleTeamUpdate,
  handleTeamDeletion,
  handleCustomTeamEvent,
  handleBulkNotification,
  handleScheduledNotification,
  handleRobustNotification
};
