import { Response } from 'express';
import { CaseService } from './case.service';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';

const getMyCases = catchAsync(async (req: any, res: Response) => {
  const user = req.user;

  const result = await CaseService.getMyCases(user, req.query);

  sendResponse(res, {
    success: true,
    message: 'Cases fetched successfully',
    data: result,
  });
});

const updateCaseStatus = catchAsync(async (req: any, res: Response) => {
  const user = req.user;
  const { id } = req.params;

  const result = await CaseService.updateCaseStatus(
    id,
    user,
    req.body
  );

  sendResponse(res, {
    success: true,
    message: 'Case status updated',
    data: result,
  });
});

export const CaseController = {
  getMyCases,
  updateCaseStatus,
};