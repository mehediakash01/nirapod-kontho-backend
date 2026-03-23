import express from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { createNgoSchema } from './ngo.validation';
import { validateRequest } from '../../middleware/validationRequest';
import { NgoController } from './ngo.controllter';


const router = express.Router();

// 🔥 Create NGO (Super Admin only)
router.post(
  '/',
  authenticate,
  requireRole('SUPER_ADMIN'),
  validateRequest(createNgoSchema),
  NgoController.createNgo
);

// Get all NGOs
router.get(
  '/',
  authenticate,
  NgoController.getAllNgo
);

// Get single NGO
router.get(
  '/:id',
  authenticate,
  NgoController.getSingleNgo
);

export const NgoRoutes = router;