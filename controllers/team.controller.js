import * as teamService from '../service/team.service.js';
import AppError from '../utils/AppError.js';
import mongoose from 'mongoose';

const { isValidObjectId } = mongoose;

export const createTeam = async (req, res, next) => {
    try {
        const {name, description, members} = req.body;
        const team = await teamService.createTeamService(name, req.user._id, description, members);
        res.status(201).json({message: "New team created successfully.", team});        
    } catch (error) {
        console.log('Error in team creation Controller :', error);
        next(error);
    }
}

export const joinToTeam = async (req, res, next) => {
    try {
        const memberId = req.user._id;
        const joiningTeamId = req.params.teamId;
        
        if (!isValidObjectId(joiningTeamId)) {
            return next(new AppError('Invalid Team ID format', 400));
        }

        const updatedTeam = await teamService.joinToTeamService(memberId, joiningTeamId);
        res.status(200).json({message: "Team join successful.", updatedTeam});
    } catch (error) {
        console.log('error in joining a team ', error);
        next(error);
    }
}

// Get all teams where user is a member
export const getTeams = async (req, res, next) => {
    try {
        const teams = await teamService.getTeamsByUserService(req.user._id);
        res.status(200).json({ teams });
    } catch (error) {
        console.log('Error in getting teams: ', error);
        next(error);
    }
}

// Add member to team (only owner can do this)
export const addMember = async (req, res, next) => {
    try {
        const { userId } = req.body;
        const { teamId } = req.params;
        
        if (!userId) {
            return next(new AppError('User ID is required', 400));
        }
        
        if (!isValidObjectId(teamId)) {
            return next(new AppError('Invalid Team ID format', 400));
        }
        
        if (!isValidObjectId(userId)) {
            return next(new AppError('Invalid User ID format', 400));
        }
        
        const updatedTeam = await teamService.addMemberToTeamService(teamId, userId, req.user._id);
        res.status(200).json({ 
            message: "Member added successfully.", 
            team: updatedTeam 
        });
    } catch (error) {
        console.log('Error in adding member to team: ', error);
        next(error);
    }
}

// Search teams by name
export const searchTeams = async (req, res, next) => {
    try {
        const { query } = req.query;
        const userId = req.user._id;
        
        if (!query || query.trim().length === 0) {
            return next(new AppError('Search query is required', 400));
        }
        
        const searchResults = await teamService.searchTeamsService(query.trim(), userId);
        res.status(200).json({ 
            teams: searchResults,
            query: query.trim()
        });
    } catch (error) {
        console.log('Error in searching teams: ', error);
        next(error);
    }
}

// Remove member from team (only owner can do this)
export const removeMember = async (req, res, next) => {
    try {
        const { teamId, memberId } = req.params;
        
        if (!isValidObjectId(teamId)) {
            return next(new AppError('Invalid Team ID format', 400));
        }
        
        if (!isValidObjectId(memberId)) {
            return next(new AppError('Invalid Member ID format', 400));
        }
        
        const updatedTeam = await teamService.removeMemberFromTeamService(teamId, memberId, req.user._id);
        res.status(200).json({
            message: "Member removed successfully.",
            team: updatedTeam
        });
    } catch (error) {
        console.log('Error in removing member from team: ', error);
        next(error);
    }
}

// Update team details (name, description)
export const updateTeam = async (req, res, next) => {
    try {
        const { teamId } = req.params;
        const { name, description } = req.body;

        if (!isValidObjectId(teamId)) {
            return next(new AppError('Invalid Team ID format', 400));
        }

        const updatedTeam = await teamService.updateTeamService(teamId, req.user._id, { name, description });
        res.status(200).json({
            message: "Team updated successfully.",
            team: updatedTeam
        });
    } catch (error) {
        console.log('Error in updating team: ', error);
        next(error);
    }
}