import { Server } from "socket.io";
import { setupConnectionHandlers } from "./connectionManager.js";
import { setupEventHandlers } from "./eventHandlers.js";

/**
 * Socket.IO Service - Main socket server management
 */
class SocketService {
  constructor() {
    this.io = null;
    this.userConnections = new Map(); // userId -> socketId
    this.MAX_CONNECTIONS_PER_USER = 1; // Only 1 connection per user
    this.MAX_TOTAL_CONNECTIONS = 100; // Prevent excessive connections
    this.MAX_ANONYMOUS_CONNECTIONS = 10; // Limit anonymous connections
  }

  /**
   * Initialize Socket.IO server
   */
  initialize(server, corsOrigin) {
    this.io = new Server(server, {
      cors: {
        origin: corsOrigin || "http://localhost:5001",
        credentials: true
      }
    });

    // Set up connection handlers
    setupConnectionHandlers(this.io, this.userConnections, this.MAX_TOTAL_CONNECTIONS, this.MAX_ANONYMOUS_CONNECTIONS);
    
    // Set up event handlers
    setupEventHandlers(this.io, this.userConnections);

    // Socket.IO server initialized
    return this.io;
  }

  /**
   * Get Socket.IO instance
   */
  getIO() {
    if (!this.io) {
      throw new Error("Socket.IO server not initialized. Call initialize() first.");
    }
    return this.io;
  }

  /**
   * Get user connections map
   */
  getUserConnections() {
    return this.userConnections;
  }

  /**
   * Check if user is connected
   */
  isUserConnected(userId) {
    return this.userConnections.has(userId);
  }

  /**
   * Get connection statistics
   */
  getConnectionStats() {
    const totalSockets = this.io ? this.io.engine.clientsCount : 0;
    const anonymousCount = totalSockets - this.userConnections.size;
    
    return {
      totalSockets,
      authenticatedUsers: this.userConnections.size,
      anonymousConnections: anonymousCount
    };
  }

  /**
   * Clean up user connection
   */
  cleanupUserConnection(userId) {
    if (this.userConnections.has(userId)) {
      const socketId = this.userConnections.get(userId);
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.disconnect(true);
      }
      this.userConnections.delete(userId);
    }
  }

  /**
   * Periodic cleanup and status logging
   */
  startPeriodicCleanup() {
    setInterval(() => {
      let cleanedCount = 0;
      
      // Only clean up sockets that are definitely disconnected
      for (const [userId, socketId] of this.userConnections.entries()) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (!socket || !socket.connected) {
          this.userConnections.delete(userId);
          cleanedCount++;
        }
      }
    }, 60000); // 60 seconds
  }
}

// Export singleton instance
export default new SocketService();

