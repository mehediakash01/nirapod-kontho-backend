import express from 'express';
import { authenticate, requireRole } from '../../middleware/auth';

import { validateRequest } from '../../middleware/validationRequest';
import { NgoController } from './ngo.controllter';
import { createNgoWithAdminSchema } from './ngo.validation';


const router = express.Router();

//  Create NGO (Super Admin only)
router.post(
  '/create-with-admin',
  authenticate,
  requireRole('SUPER_ADMIN'),
  validateRequest(createNgoWithAdminSchema),
  NgoController.createNgoWithAdmin
);;

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