export const sendResponse = <T = null, M = null>(
  res: any,
  {
    statusCode = 200,
    success = true,
    message = '',
    meta,
    data = undefined,
  }: {
    statusCode?: number;
    success?: boolean;
    message?: string;
    meta?: M;
    data?: T;
  }
) => {
  res.status(statusCode).json({
    success,
    message,
    meta,
    data,
  });
};