import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { ReportService } from './report.service';
import { VerificationService } from '../verification/verificaton.service';
import { AppError } from '../../errors/AppError';



const createReport = catchAsync(async (req: any, res: Response) => {
  const userId = req.user.id;

  const result = await ReportService.createReport(userId, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Report created successfully',
    data: result,
  });
});

const getMyReports = catchAsync(async (req: any, res: Response) => {
  const userId = req.user.id;

  const result = await ReportService.getMyReports(userId);

  sendResponse(res, {
    success: true,
    message: 'My reports fetched',
    data: result,
  });
});

const getAllReports = catchAsync(async (req:Request, res:Response) => {
  const result = await ReportService.getAllReports(req.query);

  sendResponse(res, {
    success: true,
    message: 'Reports fetched',
    meta: result.meta,
    data: result.data,
  });
});

const getPendingReports = catchAsync(async (req: Request, res: Response) => {
  const result = await VerificationService.getPendingReports();

  sendResponse(res, {
    success: true,
    message: 'Pending reports fetched',
    data: result,
  });
});

const updateReportStatus = catchAsync(async (req: any, res: Response) => {
  const moderatorId = req.user.id;
  const { id } = req.params;
  const { status, note } = req.body;

  const result = await VerificationService.verifyReport(moderatorId, {
    reportId: id,
    status,
    feedback: note,
  });

  sendResponse(res, {
    success: true,
    message: 'Report status updated successfully',
    data: result,
  });
});

const assignNgoToReport = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id || Array.isArray(id)) {
    throw new AppError('Invalid report id', 400);
  }

  const actorUserId = (req as any).user?.id as string | undefined;
  const result = await ReportService.assignNgoToReport(id, req.body, actorUserId);

  sendResponse(res, {
    success: true,
    message: 'NGO assigned to report successfully',
    data: result,
  });
});

const getAssignmentRecommendations = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id || Array.isArray(id)) {
    throw new AppError('Invalid report id', 400);
  }

  const result = await ReportService.getAssignmentRecommendations(id);

  sendResponse(res, {
    success: true,
    message: 'Assignment recommendations fetched successfully',
    data: result,
  });
});

const getAssignmentAuditLogs = catchAsync(async (_req: Request, res: Response) => {
  const result = await ReportService.getAssignmentAuditLogs();

  sendResponse(res, {
    success: true,
    message: 'Assignment audit logs fetched successfully',
    data: result,
  });
});

export const ReportController = {
  createReport,
  getMyReports,
  getAllReports,
  getPendingReports,
  updateReportStatus,
  assignNgoToReport,
  getAssignmentRecommendations,
  getAssignmentAuditLogs,
};