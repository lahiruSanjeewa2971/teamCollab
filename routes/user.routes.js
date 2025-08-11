import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import * as userController from "../controllers/user.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", userController.getAllUsersController);
router.get("/search", userController.searchUsersController);

export default router;