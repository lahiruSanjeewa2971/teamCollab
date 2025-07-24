import { verifyAccessToken } from "../utils/token.js";
import AppError from "../utils/AppError.js";
import User from "../models/User.js";

const authMiddleware = async (req, res, next) => {
  try {
    // Here authenticate the API header for a valid token and set the existing user details for later uses.
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new AppError("No token provided.", 401));
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded._id);

    if (!user) return next(new AppError("User not found.", 401));

    req.user = user;
    next();
  } catch (error) {
    console.log("Error in authMiddleware :", error);
    next(new AppError("Invalid or expired token.", 401));
  }
};

export default authMiddleware;
