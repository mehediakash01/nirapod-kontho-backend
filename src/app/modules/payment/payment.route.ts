import express from 'express';
import { PaymentController } from './payment.controller';
import { authenticate } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validationRequest';
import {
  createPaymentIntentSchema,
  confirmPaymentSchema,
} from './payment.validation';


const router = express.Router();

router.post(
  '/create-payment-intent',
  authenticate,
  validateRequest(createPaymentIntentSchema),
  PaymentController.createPaymentIntent
);

router.post(
  '/confirm',
  authenticate,
  validateRequest(confirmPaymentSchema),
  PaymentController.confirmPayment
);

export const PaymentRoutes = router;