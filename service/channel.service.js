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
      const team = await findTeamById(channel.teamId);
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
}

export default new ChannelService();
