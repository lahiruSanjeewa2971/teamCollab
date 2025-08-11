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

// Get all teams where user is a member
export const getTeamsByUserMembership = async (userId) => {
  return await Team.find({ members: userId })
    .populate('owner', 'name email')
    .populate('members', 'name email')
    .sort({ createdAt: -1 });
};

// Update team members (add new member)
export const updateTeamMembers = async (teamId, userId) => {
  return await Team.findByIdAndUpdate(
    teamId,
    { $addToSet: { members: userId } },
    { new: true }
  ).populate('owner', 'name email')
   .populate('members', 'name email');
};

// Update team details (name, description)
export const updateTeamDetails = async (teamId, updateData) => {
    return await Team.findByIdAndUpdate(
        teamId,
        updateData,
        { new: true, runValidators: true }
    ).populate('owner', 'name email')
     .populate('members', 'name email');
};
