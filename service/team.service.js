import Team from '../models/Team.js';
import { addMemberToTeam, createNewTeam, findTeamById, findTeamByName } from '../repository/team.repository.js';
import AppError from '../utils/AppError.js';

export const createTeamService = async (name, ownerId, members = []) => {
    const existingTeam = await findTeamByName(name);
    if(existingTeam){
        throw new AppError("Team name already exist.", 400);
    }

    const teamData = {
        name, owner: ownerId, members: [ownerId, ...members]
    }
    const creation =  await createNewTeam(teamData);
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