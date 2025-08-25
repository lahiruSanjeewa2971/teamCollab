import Channel from '../models/Channel.js';

class ChannelRepository {
  /**
   * Create a new channel
   */
  async createChannel(channelData) {
    try {
      const channel = new Channel(channelData);
      return await channel.save();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get channels by team ID
   */
  async getChannelsByTeam(teamId) {
    try {
      return await Channel.find({ teamId })
        .sort({ name: 1 }) // Sort alphabetically by name
        .populate('createdBy', 'name email')
        .lean();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if channel name exists within a team
   */
  async isChannelNameTaken(teamId, nameLower) {
    try {
      const existingChannel = await Channel.findOne({ 
        teamId, 
        nameLower: nameLower.toLowerCase() 
      });
      return !!existingChannel;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get channel by ID
   */
  async getChannelById(channelId) {
    try {
      return await Channel.findById(channelId)
        .populate('createdBy', 'name email')
        .populate('teamId', 'name');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all channels where user is a member
   */
  async getChannelsByUser(userId) {
    try {
      const channels = await Channel.find({
        'members.userId': userId
      })
        .populate('createdBy', 'name email')
        .populate('teamId', 'name')
        .sort({ createdAt: -1 })
        .lean();
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
      const channels = await Channel.find({
        teamId: { $in: teamIds }
      })
        .populate('createdBy', 'name email')
        .populate('teamId', 'name')
        .sort({ name: 1 })
        .lean();
      return channels;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add a member to a channel
   */
  async addMemberToChannel(channelId, userId) {
    try {
      const channel = await Channel.findByIdAndUpdate(
        channelId,
        {
          $push: {
            members: {
              userId: userId,
              role: 'member',
              joinedAt: new Date()
            }
          }
        },
        { new: true }
      )
        .populate('createdBy', 'name email')
        .populate('teamId', 'name');

      return channel;
    } catch (error) {
      throw error;
    }
  }
}

export default new ChannelRepository();
