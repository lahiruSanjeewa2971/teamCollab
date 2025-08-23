/**
 * Connection Manager - Handles Socket.IO connections, authentication, and room management
 */

/**
 * Set up connection handlers for Socket.IO
 */
export const setupConnectionHandlers = (io, userConnections, maxTotalConnections, maxAnonymousConnections) => {
  io.on("connection", (socket) => {
    // Check total connection limit
    if (io.engine.clientsCount > maxTotalConnections) {
      socket.emit('connection:rejected', { 
        reason: 'Server connection limit exceeded',
        maxConnections: maxTotalConnections
      });
      socket.disconnect(true);
      return;
    }

    // Count anonymous connections
    const anonymousCount = io.engine.clientsCount - userConnections.size;
    if (anonymousCount > maxAnonymousConnections) {
      socket.emit('connection:rejected', { 
        reason: 'Too many anonymous connections, please authenticate first',
        maxAnonymousConnections: maxAnonymousConnections
      });
      socket.disconnect(true);
      return;
    }

    // Authentication timeout - extended to 30 seconds for better reliability
    const authTimeout = setTimeout(() => {
      if (!socket.userId) {
        socket.emit('connection:rejected', { 
          reason: 'Authentication timeout - user must join a room within 30 seconds',
          socketId: socket.id
        });
        socket.disconnect(true);
      }
    }, 30000); // 30 seconds

    let currentUserId = null;

    // Join user to their personal room
    socket.on("join-user-room", (userId) => {
      clearTimeout(authTimeout);
      
      // Check if user already has an active connection
      const existingSocketId = userConnections.get(userId);
      if (existingSocketId && existingSocketId !== socket.id) {
        socket.emit('connection:rejected', { 
          reason: 'User already connected from another location',
          userId: userId 
        });
        socket.disconnect(true);
        return;
      }

      // Leave previous room if switching users
      if (currentUserId && currentUserId !== userId) {
        socket.leave(`user-${currentUserId}`);
        userConnections.delete(currentUserId);
      }
      
      // Join new personal room
      currentUserId = userId;
      socket.join(`user-${userId}`);
      
      socket.userId = userId;
      userConnections.set(userId, socket.id);
      
      // Set up heartbeat to keep connection alive
      socket.heartbeatInterval = setInterval(() => {
        if (socket.connected) {
          socket.emit('ping');
        }
      }, 25000); // Send ping every 25 seconds
    });

    // Handle heartbeat responses
    socket.on("pong", () => {
      // Connection is alive, reset any timeout counters
      socket.lastPong = Date.now();
    });

    socket.on("disconnect", (reason) => {
      if (authTimeout) {
        clearTimeout(authTimeout);
      }
      
      // Clear heartbeat interval
      if (socket.heartbeatInterval) {
        clearInterval(socket.heartbeatInterval);
        socket.heartbeatInterval = null;
      }
      
      if (currentUserId) {
        userConnections.delete(currentUserId);
      }
    });

    socket.on("error", (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
      if (currentUserId) {
        userConnections.delete(currentUserId);
      }
    });

                    // Handle team room events for channel operations
                socket.on("join-team-room", (teamId) => {
                  if (currentUserId) {
                    socket.join(`team:${teamId}`);
                  }
                });

                socket.on("leave-team-room", (teamId) => {
                  if (currentUserId) {
                    socket.leave(`team:${teamId}`);
                  }
                });
  });
};
