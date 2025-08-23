/**
 * Event Handlers - Handles all Socket.IO event logic and notifications
 */

let ioInstance = null;
let userConnectionsMap = null;

/**
 * Set up event handlers for Socket.IO
 */
export const setupEventHandlers = (io, userConnections) => {
  ioInstance = io;
  userConnectionsMap = userConnections;
  
  // This file can be extended with additional event handlers in the future
  // For now, it's minimal since we only have basic team removal notifications
  
  console.log("Event handlers initialized");
};

/**
 * Clean notification helper function
 * @param {string} userId - The user ID to notify
 * @param {string} eventName - The event name to emit
 * @param {Object} payload - The data to send
 */
export const notifyUser = (userId, eventName, payload) => {
  if (!ioInstance || !userConnectionsMap) {
    console.error("Socket service not initialized");
    return;
  }
  
  if (!userConnectionsMap.has(userId)) {
    console.log(`⚠️ User ${userId} not connected, skipping notification: ${eventName}`);
    return;
  }
  
  ioInstance.to(`user-${userId}`).emit(eventName, payload);
  console.log(`✅ Notification sent to user ${userId}: ${eventName}`);
};

/**
 * Handle user logout cleanup
 * @param {string} userId - The user ID to clean up
 */
export const handleUserLogout = (userId) => {
  if (!ioInstance || !userConnectionsMap) {
    console.error("Socket service not initialized");
    return;
  }
  
  if (userConnectionsMap.has(userId)) {
    const socketId = userConnectionsMap.get(userId);
    const socket = ioInstance.sockets.sockets.get(socketId);
    if (socket) {
      socket.disconnect(true);
    }
    userConnectionsMap.delete(userId);
    console.log(`🚪 User ${userId} logged out, connection cleaned up`);
    console.log(`📊 Active connections: ${userConnectionsMap.size}`);
  }
};
