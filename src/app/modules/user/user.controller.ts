import { Request, Response } from 'express';
import { UserServices } from './user.service';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';

const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  
  if (!user || !user.id) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const result = await UserServices.updateProfile(user.id, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Profile updated successfully',
    data: result,
  });
});

export const UserControllers = {
  updateProfile,
};