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
