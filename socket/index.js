/**
 * Socket Module - Main entry point for all socket functionality
 */

import socketService from './socketService.js';
import { notifyUser, handleUserLogout } from './eventHandlers.js';

// Export the main socket service
export default socketService;

// Export utility functions
export { notifyUser, handleUserLogout };

// Export the io instance getter
export const getIO = () => socketService.getIO();

// Export connection management functions
export const isUserConnected = (userId) => socketService.isUserConnected(userId);
export const getConnectionStats = () => socketService.getConnectionStats();
export const cleanupUserConnection = (userId) => socketService.cleanupUserConnection(userId);
