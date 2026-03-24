import { Request, Response } from 'express';
import { PaymentService } from './payment.service';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { stripe } from '../../config/stripe';

const createPaymentIntent = catchAsync(async (req: any, res: Response) => {
  const userId = req.user.id;
  const { amount } = req.body;

  const result = await PaymentService.createPaymentIntent(
    userId,
    amount
  );

  sendResponse(res, {
    success: true,
    message: 'Payment intent created',
    data: result,
  });
});

const confirmPayment = catchAsync(async (req: any, res: Response) => {
  const userId = req.user.id;
  const { paymentIntentId } = req.body;

  const result = await PaymentService.confirmPayment(userId, paymentIntentId);

  sendResponse(res, {
    success: true,
    message: 'Payment confirmed',
    data: result,
  });
});

const handleWebhook = async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || typeof signature !== 'string') {
    return res.status(400).json({ message: 'Missing stripe-signature header' });
  }

  if (!webhookSecret) {
    return res.status(500).json({ message: 'Missing STRIPE_WEBHOOK_SECRET' });
  }

  try {
    const event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    await PaymentService.handleWebhookEvent(event);

    return res.status(200).json({ received: true });
  } catch (error: any) {
    return res.status(400).json({ message: `Webhook Error: ${error.message}` });
  }
};

export const PaymentController = {
  createPaymentIntent,
  confirmPayment,
  handleWebhook,
};