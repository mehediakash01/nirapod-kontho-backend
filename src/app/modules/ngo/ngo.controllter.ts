import { Request, Response } from 'express';
import { NgoService } from './ngo.service';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { AppError } from '../../errors/AppError';

const createNgoWithAdmin = catchAsync(async (req:Request, res:Response) => {
  const result = await NgoService.createNgoWithAdmin(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'NGO and Admin created successfully',
    data: result,
  });
});

const getAllNgo = catchAsync(async (req: Request, res: Response) => {
  const result = await NgoService.getAllNgo();

  sendResponse(res, {
    success: true,
    message: 'NGOs fetched successfully',
    data: result,
  });
});

const getSingleNgo = catchAsync(async (req:Request, res:Response) => {
  const { id } = req.params;

  if (!id || Array.isArray(id)) {
    throw new AppError('Invalid NGO id', 400);
  }

  const result = await NgoService.getSingleNgo(id);

  sendResponse(res, {
    success: true,
    message: 'NGO fetched successfully',
    data: result,
  });
});

const getAnalytics = catchAsync(async (req: Request, res: Response) => {
  const result = await NgoService.getAnalytics();

  sendResponse(res, {
    success: true,
    message: 'Super admin analytics fetched successfully',
    data: result,
  });
});

export const NgoController = {
  createNgoWithAdmin,
  getAllNgo,
  getSingleNgo,
  getAnalytics,
};