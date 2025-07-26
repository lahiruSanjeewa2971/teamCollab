import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import * as teamController from "../controllers/team.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", teamController.createTeam);
router.post("/:teamId/join", teamController.joinToTeam);

export default router;
