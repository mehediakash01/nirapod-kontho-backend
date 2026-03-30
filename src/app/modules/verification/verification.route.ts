import express from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { VerificationController } from './verificaiton.controller';
import { verifyReportSchema } from './verification.validation';
import { validateRequest } from '../../middleware/validationRequest';

const router = express.Router();

//  Get pending reports (Moderator)
router.get(
  '/pending',
  authenticate,
  requireRole('MODERATOR', 'SUPER_ADMIN'),
  VerificationController.getPendingReports
);

router.get(
  '/overview',
  authenticate,
  requireRole('MODERATOR', 'SUPER_ADMIN'),
  VerificationController.getOverview
);

router.get(
  '/recent',
  authenticate,
  requireRole('MODERATOR', 'SUPER_ADMIN'),
  VerificationController.getRecentDecisions
);

//  Verify report
router.post(
  '/',
  authenticate,
  requireRole('MODERATOR', 'SUPER_ADMIN'),
  validateRequest(verifyReportSchema),
  VerificationController.verifyReport
);

export const VerificationRoutes = router;