import express from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validationRequest';
import { ReportController } from './report.controller';
import { assignReportSchema, createReportSchema, updateReportStatusSchema } from './report.validation';

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

// Get pending reports (Moderator)
router.get(
  '/pending',
  authenticate,
  requireRole('SUPER_ADMIN', 'MODERATOR'),
  ReportController.getPendingReports
);

// Update report status (Moderator)
router.patch(
  '/:id/status',
  authenticate,
  requireRole('SUPER_ADMIN', 'MODERATOR'),
  validateRequest(updateReportStatusSchema),
  ReportController.updateReportStatus
);

// Assign NGO to report (Super Admin)
router.patch(
  '/:id/assign',
  authenticate,
  requireRole('SUPER_ADMIN'),
  validateRequest(assignReportSchema),
  ReportController.assignNgoToReport
);

router.get(
  '/:id/recommendations',
  authenticate,
  requireRole('SUPER_ADMIN'),
  ReportController.getAssignmentRecommendations
);

router.get(
  '/audit-logs/assignments',
  authenticate,
  requireRole('SUPER_ADMIN'),
  ReportController.getAssignmentAuditLogs
);

// Admin/Moderator get all reports
router.get(
  '/',
  authenticate,
  requireRole('SUPER_ADMIN', 'MODERATOR'),
  ReportController.getAllReports
);

export const ReportRoutes = router;