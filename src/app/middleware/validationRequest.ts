import { ZodError, ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if body exists
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Request body is empty or Content-Type is not application/json',
        });
      }

      const parsed = schema.parse(req.body) as unknown;

      req.body = parsed;

      next();
    } catch (err: any) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation Error',
          error: err.issues,
        });
      }

      res.status(400).json({
        success: false,
        message: 'Validation Error',
        error: err,
      });
    }
  };
};