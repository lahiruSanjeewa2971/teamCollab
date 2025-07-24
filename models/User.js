import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  avatarUrl: {
    type: String,
  },
  role: {
    type: String,
    enum: ["user", "admin", "moderator"],
    default: "user",
  },
  /**
   * is an array to allow each user to have multiple valid refresh tokens at the same time. This supports scenarios like:
   *
   * Logging in from multiple devices or browsers (each device gets its own refresh token).
   * Allowing users to stay logged in on several sessions without invalidating others.
   * Managing token revocation: you can remove a specific token from the array when a user logs out from one device, without affecting other sessions.
   * This design improves flexibility and security for multi-device authentication.
   */
  refreshToken: [
    {
      type: String,
    },
  ],
}, {timestamps: true});

const User = mongoose.model("User", UserSchema);
export default User;
