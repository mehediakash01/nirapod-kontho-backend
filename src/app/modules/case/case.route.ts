import express from 'express';
import { CaseController } from './case.controller';

import { updateCaseSchema } from './case.validation';
import { authenticate, requireRole } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validationRequest';

const router = express.Router();

// NGO dashboard → get assigned cases
router.get(
  '/my',
  authenticate,
  requireRole('NGO_ADMIN'),
  CaseController.getMyCases
);

// update case status
router.patch(
  '/:id',
  authenticate,
  requireRole('NGO_ADMIN'),
  validateRequest(updateCaseSchema),
  CaseController.updateCaseStatus
);

export const CaseRoutes = router;