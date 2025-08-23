/**
 * Channel Events - Socket.IO events for channel operations
 */

/**
 * Emit channel created event to team room
 * @param {Object} io - Socket.IO instance
 * @param {string} teamId - Team ID
 * @param {Object} channel - Created channel data
 */
export const emitChannelCreated = (io, teamId, channel) => {
  try {
    io.to(`team:${teamId}`).emit('channel:created', {
      teamId,
      channel
    });
  } catch (error) {
    console.error('Error emitting channel:created event:', error);
  }
};

/**
 * Emit channel updated event to team room
 * @param {Object} io - Socket.IO instance
 * @param {string} teamId - Team ID
 * @param {Object} channel - Updated channel data
 */
export const emitChannelUpdated = (io, teamId, channel) => {
  try {
    io.to(`team:${teamId}`).emit('channel:updated', {
      teamId,
      channel
    });
  } catch (error) {
    console.error('Error emitting channel:updated event:', error);
  }
};

/**
 * Emit channel deleted event to team room
 * @param {Object} io - Socket.IO instance
 * @param {string} teamId - Team ID
 * @param {string} channelId - Deleted channel ID
 */
export const emitChannelDeleted = (io, teamId, channelId) => {
  try {
    io.to(`team:${teamId}`).emit('channel:deleted', {
      teamId,
      channelId
    });
  } catch (error) {
    console.error('Error emitting channel:deleted event:', error);
  }
};
