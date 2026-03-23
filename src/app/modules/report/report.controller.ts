import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { ReportService } from './report.service';



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
export const ReportController = {
  createReport,
  getMyReports,
  getAllReports,
};