import channelService from '../service/channel.service.js';

/**
 * Create a new channel
 */
export const createChannel = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const { name, displayName, description, type } = req.body;
    const userId = req.user._id;

    const channelData = {
      teamId,
      name,
      displayName,
      description,
      type
    };

    const channel = await channelService.createChannel(channelData, userId);

    res.status(201).json({
      success: true,
      channel
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get channels by team ID
 */
export const getChannelsByTeam = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const userId = req.user._id;

    const channels = await channelService.getChannelsByTeam(teamId, userId);

    res.status(200).json({
      success: true,
      channels
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get channel by ID
 */
export const getChannelById = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const userId = req.user._id;

    console.log('1')
    const channel = await channelService.getChannelById(channelId, userId);
    console.log('channel :', channel);

    res.status(200).json({
      success: true,
      channel
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all channels where user is a member
 */
export const getUserChannels = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const channels = await channelService.getUserChannels(userId);

    res.status(200).json({
      success: true,
      channels
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all channels from teams where user is a member
 */
export const getChannelsFromUserTeams = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { teamIds } = req.body;

    if (!teamIds || !Array.isArray(teamIds)) {
      return res.status(400).json({
        success: false,
        message: 'teamIds array is required'
      });
    }

    const channels = await channelService.getChannelsFromUserTeams(userId, teamIds);

    res.status(200).json({
      success: true,
      channels
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Join a channel
 */
export const joinChannel = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const userId = req.user._id;

    const channel = await channelService.joinChannel(channelId, userId);

    res.status(200).json({
      success: true,
      channel
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add multiple members to a channel
 */
export const addMembersToChannel = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const { userIds } = req.body;
    const adminUserId = req.user._id;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'userIds array is required and must not be empty'
      });
    }

    const channel = await channelService.addMembersToChannel(channelId, userIds, adminUserId);

    res.status(200).json({
      success: true,
      channel,
      message: `${userIds.length} member${userIds.length !== 1 ? 's' : ''} added successfully`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get team members for a channel (for adding members)
 */
export const getChannelTeamMembers = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const userId = req.user._id;

    const team = await channelService.getChannelTeamMembers(channelId, userId);

    res.status(200).json({
      success: true,
      team
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove a member from a channel
 */
export const removeMemberFromChannel = async (req, res, next) => {
  try {
    const { channelId, memberId } = req.params;
    const adminUserId = req.user._id;

    if (!memberId) {
      return res.status(400).json({
        success: false,
        message: 'Member ID is required'
      });
    }

    const channel = await channelService.removeMemberFromChannel(channelId, memberId, adminUserId);

    res.status(200).json({
      success: true,
      channel,
      message: 'Member removed from channel successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update channel information
 */
export const updateChannel = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const { name, displayName, description, type } = req.body;
    const adminUserId = req.user._id;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (displayName !== undefined) updateData.displayName = displayName;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;

    const channel = await channelService.updateChannel(channelId, updateData, adminUserId);

    res.status(200).json({
      success: true,
      channel,
      message: 'Channel updated successfully'
    });
  } catch (error) {
    next(error);
  }
};
