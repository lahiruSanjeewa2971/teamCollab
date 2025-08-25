import channelRepository from '../repository/channel.repository.js';
import { findTeamById } from '../repository/team.repository.js';
import AppError from '../utils/AppError.js';
import { emitChannelCreated } from '../socket/channelEvents.js';
import { getIO } from '../socket/index.js';

class ChannelService {
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
      const isMember = team.members.some(member => 
        member.toString() === userId.toString()
      );
      if (!isMember) {
        throw new AppError('You are not a member of this team', 403);
      }

      // Check if user is the team owner
      if (team.owner.toString() !== userId.toString()) {
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
      const isOwner = team.owner.toString() === userId.toString();
      const isMember = team.members.some(member => 
        member.toString() === userId.toString()
      );
      
      if (!isOwner && !isMember) {
        throw new AppError('You are not a member of this team', 403);
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
      if (!channel) {
        throw new AppError('Channel not found', 404);
      }

      // Check if user is member of the team
      // channel.teamId might be populated or just an ID string
      let teamId;
      if (typeof channel.teamId === 'object' && channel.teamId._id) {
        teamId = channel.teamId._id;
      } else if (typeof channel.teamId === 'string') {
        teamId = channel.teamId;
      } else {
        throw new AppError('Invalid team ID format', 400);
      }
      
      const team = await findTeamById(teamId);
      if (!team) {
        throw new AppError('Team not found', 404);
      }

      const isMember = team.members.some(member => 
        member.toString() === userId.toString()
      );
      if (!isMember) {
        throw new AppError('You are not a member of this team', 403);
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
      const isAlreadyMember = channel.members.some(member => 
        member.userId.toString() === userId.toString()
      );
      
      if (isAlreadyMember) {
        throw new AppError('You are already a member of this channel', 400);
      }

      // Check if user is member of the team
      // channel.teamId might be populated or just an ID string
      let teamId;
      if (typeof channel.teamId === 'object' && channel.teamId._id) {
        teamId = channel.teamId._id;
        console.log('🔍 joinChannel: Extracted teamId from object:', teamId);
      } else if (typeof channel.teamId === 'string') {
        teamId = channel.teamId;
        console.log('🔍 joinChannel: Using teamId as string:', teamId);
      } else {
        console.log('🔍 joinChannel: Invalid teamId format:', channel.teamId);
        throw new AppError('Invalid team ID format', 400);
      }
      
      console.log('🔍 joinChannel: About to call findTeamById with teamId:', teamId);
      const team = await findTeamById(teamId);
      if (!team) {
        throw new AppError('Team not found', 404);
      }

      const isTeamMember = team.members.some(member => 
        member.toString() === userId.toString()
      );
      if (!isTeamMember) {
        throw new AppError('You are not a member of this team', 403);
      }

      // Add user to channel members
      const updatedChannel = await channelRepository.addMemberToChannel(channelId, userId);

      // Emit socket event for real-time updates
      try {
        const io = getIO();
        emitChannelMemberJoined(io, teamId, updatedChannel, userId);
      } catch (socketError) {
        // Socket event emission failed, but channel joined successfully
      }

      return updatedChannel;
    } catch (error) {
      throw error;
    }
  }
}

export default new ChannelService();
