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
