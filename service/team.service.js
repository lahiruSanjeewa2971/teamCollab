import Team from '../models/Team.js';
import { 
    findTeamByName, 
    createNewTeam, 
    findTeamById, 
    addMemberToTeam, 
    getTeamsByUserMembership, 
    updateTeamMembers, 
    searchTeamsByName, 
    removeMemberFromTeam, 
    updateTeamDetails 
} from "../repository/team.repository.js";
import channelRepository from "../repository/channel.repository.js";
import AppError from "../utils/AppError.js";

export const createTeamService = async (name, ownerId, description = "", members = []) => {
    const existingTeam = await findTeamByName(name);
    if(existingTeam){
        throw new AppError("Team name already exists.", 400);
    }

    const teamData = {
        name, 
        description,
        owner: ownerId, 
        members: [ownerId, ...members]
    }
    const creation = await createNewTeam(teamData);
    return creation;
}

export const joinToTeamService = async (memberId, joiningTeamId) => {
    // find is there any team exist
    const teamExist = await findTeamById(joiningTeamId)
    // console.log('team exist :', teamExist)
    if(!teamExist){
        throw new AppError('Team not found, you cannot join to the desired team. please check again team code', 404);
    }

    // if exist, add user to the members list
    const updatedTeam = await addMemberToTeam(joiningTeamId, memberId);
    return updatedTeam;
}

// Get all teams where user is a member
export const getTeamsByUserService = async (userId) => {
    // console.log('getTeamsByUserService: Called with userId:', userId);
    const teams = await getTeamsByUserMembership(userId);
    // console.log('getTeamsByUserService: Raw teams from repository:', teams);
    
    // Add isOwner flag to each team
    const teamsWithOwnership = teams.map(team => ({
        ...team.toObject(),
        isOwner: team.owner._id.toString() === userId.toString()
    }));
    
    // console.log('getTeamsByUserService: Teams with ownership flags:', teamsWithOwnership);
    return teamsWithOwnership;
}

// Add member to team (only owner can do this)
export const addMemberToTeamService = async (teamId, userId, requesterId) => {
    const team = await findTeamById(teamId);
    
    if (!team) {
        throw new AppError('Team not found', 404);
    }
    
    // Check if requester is the team owner
    const ownerId = typeof team.owner === 'object' && team.owner._id ? team.owner._id.toString() : team.owner.toString();
    if (ownerId !== requesterId.toString()) {
        throw new AppError('Only team owner can add members', 403);
    }
    
    // Check if user is already a member
    if (team.members.includes(userId)) {
        throw new AppError('User is already a member of this team', 400);
    }
    
    const updatedTeam = await updateTeamMembers(teamId, userId);
    return updatedTeam;
}

// Search teams by name
export const searchTeamsService = async (query, userId) => {
    const searchResults = await searchTeamsByName(query, userId);
    
    // Add isOwner flag and isMember flag to each team
    const teamsWithFlags = searchResults.map(team => ({
        ...team.toObject(),
        isOwner: team.owner._id.toString() === userId.toString(),
        isMember: team.members.some(member => member._id.toString() === userId.toString())
    }));
    
    return teamsWithFlags;
}

// Remove member from team (only owner can do this)
export const removeMemberFromTeamService = async (teamId, memberId, requesterId) => {
    const team = await findTeamById(teamId);
    
    if (!team) {
        throw new AppError('Team not found', 404);
    }
    
    // Check if requester is the team owner
    const ownerId = typeof team.owner === 'object' && team.owner._id ? team.owner._id.toString() : team.owner.toString();
    if (ownerId !== requesterId.toString()) {
        throw new AppError('Only team owner can remove members', 403);
    }
    
    // Check if trying to remove the owner
    if (ownerId === memberId.toString()) {
        throw new AppError('Cannot remove team owner', 400);
    }
    
    // Check if user is actually a member
    const isMember = team.members.some(member => {
        if (typeof member === 'object' && member._id) {
            // Populated member object
            return member._id.toString() === memberId.toString();
        } else {
            // Unpopulated member ID string
            return member.toString() === memberId.toString();
        }
    });
    if (!isMember) {
        throw new AppError('User is not a member of this team', 400);
    }

    // SAFETY CHECK: Check if team has channels and if the user is a member of any channels
    try {
        const teamChannels = await channelRepository.getChannelsByTeam(teamId);
        
        if (teamChannels && teamChannels.length > 0) {
            // Check if the user being removed is a member of any channels
            for (const channel of teamChannels) {
                const isChannelMember = channel.members.some(member => {
                    const memberUserId = typeof member.userId === 'object' && member.userId._id 
                        ? member.userId._id.toString() 
                        : member.userId.toString();
                    return memberUserId === memberId.toString();
                });
                
                if (isChannelMember) {
                    throw new AppError(
                        `Cannot remove user from team. User is a member of channel '${channel.name}'. Remove user from all channels first.`, 
                        400
                    );
                }
            }
        }
    } catch (error) {
        // If it's our custom error, re-throw it
        if (error instanceof AppError) {
            throw error;
        }
        // If it's a different error (e.g., database error), log it but continue
        console.error('Error checking channels for safety check:', error);
        // Continue with removal if we can't verify channels
    }
    
    const updatedTeam = await removeMemberFromTeam(teamId, memberId);
    
    // Return additional data for Socket.IO notification
    return {
        team: updatedTeam,
        removedMemberId: memberId,
        teamName: team.name
    };
};

// Update team details (only owner can do this)
export const updateTeamService = async (teamId, requesterId, updateData) => {
    const team = await findTeamById(teamId);
    
    if (!team) {
        throw new AppError('Team not found', 404);
    }
    
    // Check if requester is the team owner
    const ownerId = typeof team.owner === 'object' && team.owner._id ? team.owner._id.toString() : team.owner.toString();
    if (ownerId !== requesterId.toString()) {
        throw new AppError('Only team owner can update team details', 403);
    }
    
    // Check if name is being updated and if it already exists
    if (updateData.name && updateData.name !== team.name) {
        const existingTeam = await findTeamByName(updateData.name);
        if (existingTeam && existingTeam._id.toString() !== teamId) {
            throw new AppError('Team name already exists', 400);
        }
    }
    
    const updatedTeam = await updateTeamDetails(teamId, updateData);
    return updatedTeam;
}