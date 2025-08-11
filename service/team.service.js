import Team from '../models/Team.js';
import { 
    addMemberToTeam, 
    createNewTeam, 
    findTeamById, 
    findTeamByName,
    getTeamsByUserMembership,
    updateTeamMembers,
    updateTeamDetails
} from '../repository/team.repository.js';
import AppError from '../utils/AppError.js';

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
    console.log('team exist :', teamExist)
    if(!teamExist){
        throw new AppError('Team not found, you cannot join to the desired team. please check again team code', 404);
    }

    // if exist, add user to the members list
    const updatedTeam = await addMemberToTeam(joiningTeamId, memberId);
    return updatedTeam;
}

// Get all teams where user is a member
export const getTeamsByUserService = async (userId) => {
    const teams = await getTeamsByUserMembership(userId);
    
    // Add isOwner flag to each team
    const teamsWithOwnership = teams.map(team => ({
        ...team.toObject(),
        isOwner: team.owner._id.toString() === userId.toString()
    }));
    
    return teamsWithOwnership;
}

// Add member to team (only owner can do this)
export const addMemberToTeamService = async (teamId, userId, requesterId) => {
    const team = await findTeamById(teamId);
    
    if (!team) {
        throw new AppError('Team not found', 404);
    }
    
    // Check if requester is the team owner
    if (team.owner.toString() !== requesterId.toString()) {
        throw new AppError('Only team owner can add members', 403);
    }
    
    // Check if user is already a member
    if (team.members.includes(userId)) {
        throw new AppError('User is already a member of this team', 400);
    }
    
    const updatedTeam = await updateTeamMembers(teamId, userId);
    return updatedTeam;
}

// Update team details (only owner can do this)
export const updateTeamService = async (teamId, requesterId, updateData) => {
    const team = await findTeamById(teamId);
    
    if (!team) {
        throw new AppError('Team not found', 404);
    }
    
    // Check if requester is the team owner
    if (team.owner.toString() !== requesterId.toString()) {
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