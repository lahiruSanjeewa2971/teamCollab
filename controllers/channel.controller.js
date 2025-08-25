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

    const channel = await channelService.getChannelById(channelId, userId);

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
