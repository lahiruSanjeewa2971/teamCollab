import channelRepository from '../repository/channel.repository.js';
import { findTeamById } from '../repository/team.repository.js';
import AppError from '../utils/AppError.js';
import { emitChannelCreated } from '../socket/channelEvents.js';
import { getIO } from '../socket/index.js';

class ChannelService {
  /**
   * Utility function to safely extract ID from populated or unpopulated field
   * @param {Object|string} field - Can be populated object with _id or string ID
   * @returns {string} - Always returns string ID
   */
  _extractId(field) {
    if (typeof field === 'object' && field._id) {
      return field._id.toString();
    }
    return field.toString();
  }

  /**
   * Utility function to safely extract team ID from channel
   * @param {Object} channel - Channel object that might have populated teamId
   * @returns {string} - Always returns string team ID
   */
  _extractTeamId(channel) {
    return this._extractId(channel.teamId);
  }

  /**
   * Utility function to safely extract user ID from channel member
   * @param {Object} member - Member object that might have populated userId
   * @returns {string} - Always returns string user ID
   */
  _extractMemberUserId(member) {
    return this._extractId(member.userId);
  }

  /**
   * Utility function to safely extract creator ID from channel
   * @param {Object} channel - Channel object that might have populated createdBy
   * @returns {string} - Always returns string creator ID
   */
  _extractCreatorId(channel) {
    return this._extractId(channel.createdBy);
  }

  /**
   * Utility function to check if user is team member
   * @param {Array} teamMembers - Team members array (populated or unpopulated)
   * @param {string} userId - User ID to check
   * @returns {boolean} - True if user is team member
   */
  _isTeamMember(teamMembers, userId) {
    return teamMembers.some(member => {
      const memberId = this._extractId(member);
      return memberId === userId.toString();
    });
  }

  /**
   * Utility function to check if user is channel member
   * @param {Array} channelMembers - Channel members array (populated or unpopulated)
   * @param {string} userId - User ID to check
   * @returns {Object|null} - Member object if found, null otherwise
   */
  _findChannelMember(channelMembers, userId) {
    return channelMembers.find(member => {
      const memberUserId = this._extractMemberUserId(member);
      return memberUserId === userId.toString();
    });
  }

  /**
   * Create a new channel
   */
  async createChannel(channelData, userId) {
    try {
      const { teamId, name, displayName, description, type } = channelData;

      // Check if user is member of the team
      const team = await findTeamById(teamId);
      if (!team) {
        throw new AppError('Team not found', 404);
      }

      // Check if user is a member of the team
      const isMember = this._isTeamMember(team.members, userId);
      if (!isMember) {
        throw new AppError('You are not a member of this team 1', 403);
      }

      // Check if user is the team owner
      const isOwner = this._extractId(team.owner) === userId.toString();
      if (!isOwner) {
        throw new AppError('Only team owners can create channels', 403);
      }

      // Check if channel name is already taken within this team
      const isNameTaken = await channelRepository.isChannelNameTaken(teamId, name);
      if (isNameTaken) {
        throw new AppError('Channel name already taken', 409);
      }

                        // Create channel data
                  const channelDataToSave = {
                    teamId,
                    name,
                    nameLower: name.toLowerCase(),
                    displayName: displayName || undefined,
                    description: description || undefined,
                    type: type || 'public',
                    createdBy: userId,
                    members: [{
                      userId: userId,
                      role: 'admin',
                      joinedAt: new Date()
                    }]
                  };

      // Create and save channel
      const channel = await channelRepository.createChannel(channelDataToSave);
      
      // Populate the created channel
      const populatedChannel = await channelRepository.getChannelById(channel._id);
      
      // Emit socket event for real-time updates
      try {
        const io = getIO();
        emitChannelCreated(io, teamId, populatedChannel);
      } catch (socketError) {
        // Socket event emission failed, but channel created successfully
      }
      
      return populatedChannel;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get channels by team ID
   */
  async getChannelsByTeam(teamId, userId) {
    try {
      // Check if user is member of the team
      const team = await findTeamById(teamId);
      if (!team) {
        throw new AppError('Team not found', 404);
      }

      // Check if user is a member (either owner or regular member)
      const isOwner = this._extractId(team.owner) === userId.toString();
      const isMember = this._isTeamMember(team.members, userId);
      
      if (!isOwner && !isMember) {
        throw new AppError('You are not a member of this team 2', 403);
      }

      return await channelRepository.getChannelsByTeam(teamId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get channel by ID
   */
  async getChannelById(channelId, userId) {
    try {
      const channel = await channelRepository.getChannelById(channelId);
      console.log('channel :', channel);
      console.log('userId :', userId);
      if (!channel) {
        throw new AppError('Channel not found', 404);
      }

      // Check if user is member of the team
      const teamId = this._extractTeamId(channel);
      const team = await findTeamById(teamId);
      if (!team) {
        throw new AppError('Team not found', 404);
      }

      // Handle both populated and unpopulated member data
      if (!this._isTeamMember(team.members, userId)) {
        throw new AppError('You are not a member of this team 3', 403);
      }

      return channel;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all channels where user is a member
   */
  async getUserChannels(userId) {
    try {
      const channels = await channelRepository.getChannelsByUser(userId);
      return channels;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all channels from teams where user is a member
   */
  async getChannelsFromUserTeams(userId, teamIds) {
    try {
      if (!teamIds || teamIds.length === 0) {
        return [];
      }
      
      const channels = await channelRepository.getChannelsFromUserTeams(userId, teamIds);
      return channels;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Join a channel
   */
  async joinChannel(channelId, userId) {
    try {
      console.log('🔍 joinChannel: Starting with channelId:', channelId, 'userId:', userId);
      
      // Get the channel
      const channel = await channelRepository.getChannelById(channelId);
      if (!channel) {
        throw new AppError('Channel not found', 404);
      }
      
      console.log('🔍 joinChannel: Channel found:', {
        channelId: channel._id,
        teamId: channel.teamId,
        teamIdType: typeof channel.teamId,
        teamIdValue: channel.teamId
      });

      // Check if user is already a member
      const isAlreadyMember = channel.members.some(member => {
        const memberUserId = this._extractMemberUserId(member);
        return memberUserId === userId.toString();
      });
      
      if (isAlreadyMember) {
        throw new AppError('You are already a member of this channel', 400);
      }

      // Check if user is member of the team
      const teamId = this._extractTeamId(channel);
      console.log('🔍 joinChannel: Extracted teamId from object:', teamId);
      console.log('🔍 joinChannel: About to call findTeamById with teamId:', teamId);
      
      const team = await findTeamById(teamId);
      if (!team) {
        throw new AppError('Team not found', 404);
      }

      // Check if user is a member of the team
      if (!this._isTeamMember(team.members, userId)) {
        throw new AppError('You are not a member of this team 4', 403);
      }

      // Add user to channel
      const updatedChannel = await channelRepository.addMemberToChannel(channelId, userId);
      
      // Emit socket event for real-time updates
      try {
        const io = getIO();
        emitChannelMemberJoined(io, teamId, updatedChannel, userId);
      } catch (socketError) {
        // Socket event emission failed, but member joined successfully
      }
      
      return updatedChannel;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add multiple members to a channel
   */
  async addMembersToChannel(channelId, userIds, adminUserId) {
    try {
      // Get the channel
      const channel = await channelRepository.getChannelById(channelId);
      if (!channel) {
        throw new AppError('Channel not found', 404);
      }

      // Check if admin user is the channel creator or has admin role
      const isCreator = this._extractCreatorId(channel) === adminUserId.toString();
      const isAdmin = channel.members.some(member => {
        const memberUserId = this._extractMemberUserId(member);
        return memberUserId === adminUserId.toString() && member.role === 'admin';
      });
      
      if (!isCreator && !isAdmin) {
        throw new AppError('Only channel admins can add members', 403);
      }

      // Check if all users are team members
      const teamId = this._extractTeamId(channel);
      const team = await findTeamById(teamId);
      if (!team) {
        throw new AppError('Team not found', 404);
      }

      // Validate that all users are team members
      for (const userId of userIds) {
        if (!this._isTeamMember(team.members, userId)) {
          throw new AppError(`User ${userId} is not a member of this team`, 403);
        }
      }

      // Check if any users are already channel members
      const existingMembers = channel.members.filter(member => {
        const memberUserId = this._extractMemberUserId(member);
        return userIds.includes(memberUserId);
      });
      
      if (existingMembers.length > 0) {
        const existingNames = existingMembers.map(member => {
          const memberUserId = this._extractMemberUserId(member);
          // If memberUserId is populated, it will have name/email, otherwise use the ID
          if (typeof member.userId === 'object' && member.userId._id) {
            return member.userId.name || member.userId.email || 'Unknown';
          }
          return 'Unknown';
        }).join(', ');
        throw new AppError(`Users already in channel: ${existingNames}`, 400);
      }

      // Add members to channel
      const updatedChannel = await channelRepository.addMembersToChannel(channelId, userIds);

      // Emit socket event for real-time updates
      try {
        const io = getIO();
        userIds.forEach(userId => {
          emitChannelMemberJoined(io, teamId, updatedChannel, userId);
        });
      } catch (socketError) {
        // Socket event emission failed, but members added successfully
      }

      // Send Socket.IO notifications to added members
      try {
        const io = getIO();
        const notificationService = await import('../service/notification.service.js');
        
        // Get team details for notification
        const teamName = team?.name || 'Unknown Team';
        
        // Send notifications to each added member
        for (const userId of userIds) {
          try {
            // Create persistent notification in database
            await notificationService.default.createChannelMemberAddedNotification(
              userId, 
              channelId, 
              channel.name, 
              teamId, 
              teamName
            );
            
            // Send real-time notification via Socket.IO
            io.to(`user-${userId}`).emit('user:added-to-channel', {
              channelId,
              channelName: channel.name,
              teamId,
              teamName,
              message: `You have been added to channel '${channel.name}'`,
              timestamp: new Date().toISOString()
            });
          } catch (notificationError) {
            console.error(`Failed to send notification to user ${userId}:`, notificationError);
          }
        }
      } catch (socketError) {
        console.error('Socket.IO notification failed:', socketError);
        // Socket event emission failed, but members added successfully
      }

      return updatedChannel;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get team members for a channel (for adding members)
   */
  async getChannelTeamMembers(channelId, userId) {
    try {
      // Get the channel to check if user has access
      const channel = await channelRepository.getChannelById(channelId);
      if (!channel) {
        throw new AppError('Channel not found', 404);
      }

      // Check if user is a member of the team
      const teamId = this._extractTeamId(channel);
      const team = await findTeamById(teamId);
      if (!team) {
        throw new AppError('Team not found', 404);
      }

      // Handle both populated and unpopulated member data
      if (!this._isTeamMember(team.members, userId)) {
        throw new AppError(`User ${userId} is not a member of this team`, 403);
      }

      // Return team with populated members
      return team;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove a member from a channel
   */
  async removeMemberFromChannel(channelId, memberId, adminUserId) {
    try {
      // Get the channel
      const channel = await channelRepository.getChannelById(channelId);
      if (!channel) {
        throw new AppError('Channel not found', 404);
      }

      // Check if requester is channel admin
      const isAdmin = channel.members.some(member => {
        const memberUserId = this._extractMemberUserId(member);
        return memberUserId === adminUserId.toString() && member.role === 'admin';
      });

      if (!isAdmin) {
        throw new AppError('Only channel admins can remove members', 403);
      }

      // Check if trying to remove another admin
      const memberToRemove = this._findChannelMember(channel.members, memberId);

      if (!memberToRemove) {
        throw new AppError('Member not found in channel', 404);
      }

      if (memberToRemove.role === 'admin') {
        throw new AppError('Cannot remove another admin from the channel', 400);
      }

      // Remove the member
      const updatedChannel = await channelRepository.removeMemberFromChannel(channelId, memberId);
      
      // Emit socket event for real-time updates
      try {
        const io = getIO();
        io.to(channelId).emit('channel:member:removed', {
          channelId,
          memberId,
          channel: updatedChannel
        });
      } catch (socketError) {
        // Socket event emission failed, but member removed successfully
      }
      
      return updatedChannel;
    } catch (error) {
      throw error;
    }
  }
}

export default new ChannelService();
