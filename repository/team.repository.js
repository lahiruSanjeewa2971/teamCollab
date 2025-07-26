import Team from "../models/Team.js";

export const findTeamByName = async (teamName) => {
  return await Team.findOne({ name: teamName });
};

export const createNewTeam = async (teamData) => {
  return await Team.create(teamData);
};

export const findTeamById = async (teamId) => {
  return await Team.findById({ _id: teamId });
};

export const addMemberToTeam = async (teamId, userId) => {
  return await Team.findByIdAndUpdate(
    teamId,
    { $addToSet: { members: userId } },
    { new: true }
  );
};
