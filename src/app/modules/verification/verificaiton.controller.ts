import { Request, Response } from 'express';

import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { VerificationService } from './verificaton.service';

const verifyReport = catchAsync(async (req: any, res: Response) => {
  const moderatorId = req.user.id;

  const result = await VerificationService.verifyReport(
    moderatorId,
    req.body
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Report verification completed',
    data: result,
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

export const VerificationController = {
  verifyReport,
  getPendingReports,
};