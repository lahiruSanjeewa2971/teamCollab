import * as teamService from '../service/team.service.js';

export const createTeam = async (req, res, next) => {
    try {
        const {name, members} = req.body;
        const team = await teamService.createTeamService(name, req.user._id, members);
        res.status(201).json({message: "New team created successful.", team});        
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