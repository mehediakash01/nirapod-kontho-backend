import express from 'express';
import { UserControllers } from './user.controller';
import { authenticate } from '../../middleware/auth';

const router = express.Router();

router.patch('/profile', authenticate, UserControllers.updateProfile);

export const UserRoutes = router;