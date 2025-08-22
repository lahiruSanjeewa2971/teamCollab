import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import connectDB from "./config/db.js";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Socket.IO server initialization with clean, scalable configuration
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5000",
    credentials: true
  }
});

// Connection tracking for clean user management
const userConnections = new Map(); // userId -> socketId
const MAX_CONNECTIONS_PER_USER = 1; // Only 1 connection per user
const MAX_TOTAL_CONNECTIONS = 100; // Prevent excessive connections
const MAX_ANONYMOUS_CONNECTIONS = 10; // Limit anonymous connections

// Clean Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);
  
  // Check total connection limit
  if (io.engine.clientsCount > MAX_TOTAL_CONNECTIONS) {
    console.log(`⚠️ Connection limit exceeded (${io.engine.clientsCount}/${MAX_TOTAL_CONNECTIONS}), rejecting connection ${socket.id}`);
    socket.emit('connection:rejected', { 
      reason: 'Server connection limit exceeded',
      maxConnections: MAX_TOTAL_CONNECTIONS
    });
    socket.disconnect(true);
    return;
  }

  // Count anonymous connections
  const anonymousCount = io.engine.clientsCount - userConnections.size;
  if (anonymousCount > MAX_ANONYMOUS_CONNECTIONS) {
    console.log(`⚠️ Too many anonymous connections (${anonymousCount}/${MAX_ANONYMOUS_CONNECTIONS}), rejecting connection ${socket.id}`);
    socket.emit('connection:rejected', { 
      reason: 'Too many anonymous connections, please authenticate first',
      maxAnonymousConnections: MAX_ANONYMOUS_CONNECTIONS
    });
    socket.disconnect(true);
    return;
  }

  // Authentication timeout - extended to 30 seconds for better reliability
  const authTimeout = setTimeout(() => {
    if (!socket.userId) {
      console.log(`⏰ Socket ${socket.id} failed to authenticate within timeout, disconnecting`);
      socket.emit('connection:rejected', { 
        reason: 'Authentication timeout - user must join a room within 30 seconds',
        socketId: socket.id
      });
      socket.disconnect(true);
    }
  }, 30000); // Extended from 5 to 30 seconds

  let currentUserId = null;

  // Join user to their personal room
  socket.on("join-user-room", (userId) => {
    clearTimeout(authTimeout);
    
    // Check if user already has an active connection
    const existingSocketId = userConnections.get(userId);
    if (existingSocketId && existingSocketId !== socket.id) {
      console.log(`⚠️ User ${userId} already connected via socket ${existingSocketId}, rejecting new connection ${socket.id}`);
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
      console.log(`🔄 User ${currentUserId} switched to new user ${userId}, left room: user-${currentUserId}`);
      userConnections.delete(currentUserId);
    }
    
    // Join new personal room
    currentUserId = userId;
    socket.join(`user-${userId}`);
    console.log(`✅ User ${userId} joined personal room: user-${userId}`);
    
    socket.userId = userId;
    userConnections.set(userId, socket.id);
    
    // Set up heartbeat to keep connection alive
    socket.heartbeatInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping');
      }
    }, 25000); // Send ping every 25 seconds
    
    // Log connection statistics
    const totalSockets = io.engine.clientsCount;
    const anonymousCount = totalSockets - userConnections.size;
    console.log(`📈 Connection Stats - Total: ${totalSockets}, Authenticated: ${userConnections.size}, Anonymous: ${anonymousCount}`);
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
      console.log(`🔌 User ${currentUserId} disconnected from socket ${socket.id}, reason: ${reason}`);
      userConnections.delete(currentUserId);
      console.log(`📊 Active connections: ${userConnections.size}`);
    } else {
      console.log(`🔌 Anonymous socket disconnected: ${socket.id}, reason: ${reason}`);
    }
  });

  socket.on("error", (error) => {
    console.error(`❌ Socket error for ${socket.id}:`, error);
    if (currentUserId) {
      userConnections.delete(currentUserId);
      console.log(`📊 Active connections: ${userConnections.size}`);
    }
  });

  // Prevent team room events (we use personal rooms only)
  socket.on("join-team-room", () => {
    console.log("⚠️ Ignoring join-team-room event - using personal rooms only");
  });

  socket.on("leave-team-room", () => {
    console.log("⚠️ Ignoring leave-team-room event - using personal rooms only");
  });
});

// Periodic cleanup and status logging - reduced frequency and made less aggressive
setInterval(() => {
  let cleanedCount = 0;
  
  // Only clean up sockets that are definitely disconnected
  for (const [userId, socketId] of userConnections.entries()) {
    const socket = io.sockets.sockets.get(socketId);
    if (!socket || !socket.connected) {
      userConnections.delete(userId);
      cleanedCount++;
      console.log(`🧹 Cleaned up abandoned connection for user: ${userId}`);
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned up ${cleanedCount} abandoned connections. Active connections: ${userConnections.size}`);
  }
  
  const totalSockets = io.engine.clientsCount;
  const anonymousCount = totalSockets - userConnections.size;
  console.log(`📊 Connection Status - Total: ${totalSockets}, Authenticated: ${userConnections.size}, Anonymous: ${anonymousCount}`);
}, 60000); // Reduced from 30 to 60 seconds for less aggressive cleanup

// Export io instance for use in other files
export { io };

// Clean notification helper function
export const notifyUser = (userId, eventName, payload) => {
  if (!userConnections.has(userId)) {
    console.log(`⚠️ User ${userId} not connected, skipping notification: ${eventName}`);
    return;
  }
  
  io.to(`user-${userId}`).emit(eventName, payload);
  console.log(`✅ Notification sent to user ${userId}: ${eventName}`);
};

// Debug endpoint to check Socket.IO status
app.get('/socket-status', (req, res) => {
  const connectedSockets = Array.from(io.sockets.sockets.keys());
  const rooms = {};
  
  io.sockets.sockets.forEach((socket, id) => {
    rooms[id] = Array.from(socket.rooms);
  });
  
  res.json({
    connectedSockets: connectedSockets.length,
    rooms: rooms,
    totalSockets: io.engine.clientsCount,
    userConnections: Object.fromEntries(userConnections),
    activeUsers: userConnections.size,
    connectionStats: {
      totalSockets: io.engine.clientsCount,
      uniqueUsers: userConnections.size,
      duplicateConnections: connectedSockets.length - userConnections.size
    }
  });
});

// Test endpoint for notifications
app.post('/test-notification/:userId', (req, res) => {
  const { userId } = req.params;
  const { type = 'test', message = 'Test notification' } = req.body;
  
  if (!userConnections.has(userId)) {
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
  if (userConnections.has(userId)) {
    const socketId = userConnections.get(userId);
    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
      socket.disconnect(true);
    }
    userConnections.delete(userId);
    console.log(`🚪 User ${userId} logged out, connection cleaned up`);
    console.log(`📊 Active connections: ${userConnections.size}`);
  }
};

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Socket.IO server initialized with clean, scalable architecture`);
  });
});
