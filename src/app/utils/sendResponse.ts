export const sendResponse = <T = null>(
  res: any,
  {
    statusCode = 200,
    success = true,
    message = '',
    data = undefined,
  }: {
    statusCode?: number;
    success?: boolean;
    message?: string;
    data?: T;
  }
) => {
  res.status(statusCode).json({
    success,
    message,
    data,
  });
};