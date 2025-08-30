import express from 'express';
import { createChannel, getChannelsByTeam, getChannelById, getUserChannels, getChannelsFromUserTeams, joinChannel, addMembersToChannel, getChannelTeamMembers, removeMemberFromChannel, updateChannel } from '../controllers/channel.controller.js';
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

// POST /api/channels/from-teams - Get all channels from teams where user is a member
router.post('/channels/from-teams', getChannelsFromUserTeams);

// POST /api/channels/:channelId/join - Join a channel
router.post('/channels/:channelId/join', joinChannel);

// POST /api/channels/:channelId/members - Add multiple members to a channel
router.post('/channels/:channelId/members', addMembersToChannel);

// DELETE /api/channels/:channelId/members/:memberId - Remove a member from a channel
router.delete('/channels/:channelId/members/:memberId', removeMemberFromChannel);

// PUT /api/channels/:channelId - Update channel information
router.put('/channels/:channelId', updateChannel);

// GET /api/channels/:channelId - Get channel by ID (must come after specific routes)
router.get('/channels/:channelId', getChannelById);

// GET /api/channels/getTeamMembers/:channelId - Get team members for a channel
router.get('/channels/getTeamMembers/:channelId', getChannelTeamMembers);

export default router;
