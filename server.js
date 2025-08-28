import http from "http";
import app from "./app.js";
import connectDB from "./config/db.js";
import socketService from "./socket/index.js";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 5001;

const server = http.createServer(app);

// Initialize Socket.IO server using the socket service
const io = socketService.initialize(server, process.env.FRONTEND_URL || "http://localhost:5001");

// Socket.IO connection handling is now managed by the socket service

// Start periodic cleanup and status logging (managed by socket service)
socketService.startPeriodicCleanup();

// Export io instance for use in other files
export { io };

// Clean notification helper function
export const notifyUser = (userId, eventName, payload) => {
  import('./socket/index.js').then(({ notifyUser: socketNotifyUser }) => {
    socketNotifyUser(userId, eventName, payload);
  });
};

// Debug endpoint to check Socket.IO status
app.get('/socket-status', (req, res) => {
  const connectedSockets = Array.from(io.sockets.sockets.keys());
  const rooms = {};
  
  io.sockets.sockets.forEach((socket, id) => {
    rooms[id] = Array.from(socket.rooms);
  });
  
  const connectionStats = socketService.getConnectionStats();
  const userConnections = socketService.getUserConnections();
  
  res.json({
    connectedSockets: connectedSockets.length,
    rooms: rooms,
    totalSockets: connectionStats.totalSockets,
    userConnections: Object.fromEntries(userConnections),
    activeUsers: connectionStats.authenticatedUsers,
    connectionStats: {
      totalSockets: connectionStats.totalSockets,
      uniqueUsers: connectionStats.authenticatedUsers,
      duplicateConnections: connectedSockets.length - connectionStats.authenticatedUsers
    }
  });
});

// Test endpoint for notifications
app.post('/test-notification/:userId', (req, res) => {
  const { userId } = req.params;
  const { type = 'test', message = 'Test notification' } = req.body;
  
  if (!socketService.isUserConnected(userId)) {
    return res.status(404).json({ error: 'User not connected' });
  }
  
  const payload = {
    type,
    message,
    timestamp: new Date().toISOString(),
    test: true
  };
  
  try {
    notifyUser(userId, 'test:notification', payload);
    res.json({ 
      success: true, 
      message: 'Test notification sent',
      payload,
      userConnected: true
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send notification', details: error.message });
  }
});

// Handle user logout cleanup
export const handleUserLogout = (userId) => {
  socketService.cleanupUserConnection(userId);
};

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
