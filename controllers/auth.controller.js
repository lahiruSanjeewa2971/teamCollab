import User from "../models/User.js";
import bcrypt from "bcryptjs";
import AppError from "../utils/AppError.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/token.js";

export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return next(new AppError("Name, email, and password are required", 400));
    }

    const existingUser = await User.find({ email });
    console.log("existingUser :", existingUser);
    if (existingUser.length > 0) {
      return next(new AppError("Email already exists", 400));
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name,
      email,
      passwordHash,
      avatarUrl: null,
    });
    
    res.status(201).json({message: "User registered successfully", user: { _id: newUser._id, name: newUser.name, email: newUser.email },});
  } catch (error) {
    console.error("Error in registerUser:", error);
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    console.log('email, password :', email, password)
    if (!email || !password) {
      return next(new AppError("Email and password are required", 400));
    }

    const user = await User.findOne({ email });
    if (!user) {
      return next(new AppError("Invalid email or password", 401));
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return next(new AppError("Invalid email or password", 401));
    }

    // Generate a new access token and refresh token
    const accessToken = generateAccessToken({ _id: user._id, role: user.role });
    const refreshToken = generateRefreshToken({_id: user._id, role: user.role,});

    user.refreshToken.push(refreshToken); // Add the new refresh token to the user's array
    await user.save(); // Save the user with the new refresh token

    res.status(200).json({
      accessToken,
      refreshToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
    });
  } catch (error) {
    console.log("Error in loginUser:", error);
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return next(new AppError("Refresh token is required", 400));
    }

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded._id);
    if (!user || !user.refreshToken.includes(refreshToken)) {
      return next(new AppError("Invalid refresh token", 401));
    }

    const newAccessToken = generateAccessToken({_id: user._id, role: user.role,});
    const newRefreshToken = generateRefreshToken({_id: user._id, role: user.role,});

    // Update the user's refresh token array and remove the old token
    user.refreshToken = user.refreshToken.filter((token) => token !== refreshToken);
    user.refreshToken.push(newRefreshToken);
    await user.save();

    res.status(200).json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (error) {
    console.log("Error in refreshToken:", error);
    next(error);
  }
};

export const logoutUser = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return next(new AppError("No refresh token provided.", 401));

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded._id);

    if (!user) return next(new AppError("User not found.", 401));

    user.refreshToken = user.refreshToken.filter((token) => token !== refreshToken);
    await user.save();

    res.json({ message: "Logged out successfully." });
  } catch (error) {
    console.log("Error in logout :", error);
    next(error);
  }
};
