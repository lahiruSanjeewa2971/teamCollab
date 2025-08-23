import express from 'express';
import { createChannel, getChannelsByTeam, getChannelById, getUserChannels } from '../controllers/channel.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/teams/:teamId/channels - Get channels for a team
router.get('/teams/:teamId/channels', getChannelsByTeam);

// POST /api/teams/:teamId/channels - Create a new channel
router.post('/teams/:teamId/channels', createChannel);

// GET /api/channels/me - Get all channels where user is a member
router.get('/channels/me', getUserChannels);

// GET /api/channels/:channelId - Get channel by ID (must come after specific routes)
router.get('/channels/:channelId', getChannelById);

export default router;
