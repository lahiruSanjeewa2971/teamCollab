import * as userService from "../service/user.service.js";

export const getAllUsersController = async (req, res, next) => {
  try {
    const usersList = await userService.getAllUsersService();
    res.status(200).json(usersList);
  } catch (error) {
    console.log("error in getAllUsers :", error);
    next(error);
  }
};

// Search users by name with pagination
export const searchUsersController = async (req, res, next) => {
  try {
    const { query, page, limit } = req.query;
    
    if (!query) {
      return res.status(400).json({ 
        error: 'Search query is required' 
      });
    }
    
    const result = await userService.searchUsersByNameService(query, page, limit);
    res.status(200).json(result);
  } catch (error) {
    console.log("error in searchUsers: ", error);
    next(error);
  }
};
