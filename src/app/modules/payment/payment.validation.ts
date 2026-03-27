import { z } from 'zod';

export const createPaymentIntentSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
});

export const confirmPaymentSchema = z.object({
  paymentIntentId: z.string().min(1, 'paymentIntentId is required'),
});

export const createMonthlySubscriptionSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
});

export const createOneTimeCheckoutSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
});
