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
  console.log('getTeamsByUserMembership: Called with userId:', userId);
  console.log('getTeamsByUserMembership: userId type:', typeof userId);
  console.log('getTeamsByUserMembership: userId value:', userId);
  
  const teams = await Team.find({ members: userId })
    .populate('owner', 'name email')
    .populate('members', 'name email')
    .sort({ createdAt: -1 });
  
  console.log('getTeamsByUserMembership: Found teams:', teams);
  return teams;
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

// Search teams by name
export const searchTeamsByName = async (query, userId) => {
  // Search teams by name (case-insensitive, partial match)
  // Exclude teams where user is already a member
  return await Team.find({
    name: { $regex: query, $options: 'i' }, // Case-insensitive search
    members: { $ne: userId } // Exclude teams where user is already a member
  })
  .populate('owner', 'name email')
  .populate('members', 'name email')
  .sort({ createdAt: -1 })
  .limit(10); // Limit results to prevent overwhelming response
};

// Remove member from team
export const removeMemberFromTeam = async (teamId, memberId) => {
  return await Team.findByIdAndUpdate(
    teamId,
    { $pull: { members: memberId } },
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
