import express from 'express';
import { PaymentController } from './payment.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validationRequest';
import {
  createPaymentIntentSchema,
  confirmPaymentSchema,
  createOneTimeCheckoutSchema,
  createMonthlySubscriptionSchema,
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

router.post(
  '/monthly-subscription',
  authenticate,
  validateRequest(createMonthlySubscriptionSchema),
  PaymentController.createMonthlySubscription
);

router.post(
  '/one-time-checkout',
  authenticate,
  validateRequest(createOneTimeCheckoutSchema),
  PaymentController.createOneTimeCheckout
);

router.get(
  '/my-history',
  authenticate,
  PaymentController.getMyDonations
);

router.get(
  '/dashboard',
  authenticate,
  requireRole('SUPER_ADMIN'),
  PaymentController.getDonationDashboard
);

export const PaymentRoutes = router;