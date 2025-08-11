import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import * as teamController from "../controllers/team.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", teamController.createTeam);
router.get("/", teamController.getTeams);
router.post("/:teamId/join", teamController.joinToTeam);
router.post("/:teamId/members", teamController.addMember);
router.put("/:teamId", teamController.updateTeam);

export default router;
