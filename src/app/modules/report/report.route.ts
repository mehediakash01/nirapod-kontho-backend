import express from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validationRequest';
import { ReportController } from './report.controller';
import { createReportSchema } from './report.validation';

const router = express.Router();

// Create report
router.post(
  '/',
  authenticate,
  validateRequest(createReportSchema),
  ReportController.createReport
);

// Get my reports
router.get(
  '/my',
  authenticate,
  ReportController.getMyReports
);

// Admin/Moderator get all reports
router.get(
  '/',
  authenticate,
  requireRole('SUPER_ADMIN', 'MODERATOR'),
  ReportController.getAllReports
);

export const ReportRoutes = router;