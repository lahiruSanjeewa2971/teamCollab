import express from 'express';
import {getAllUsersController} from '../controllers/user.controller.js';

const router = express.Router();

router.get('/', getAllUsersController);

export default router;