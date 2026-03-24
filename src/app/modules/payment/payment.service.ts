import Stripe from 'stripe';
import { prisma } from '../../config/prisma';
import { stripe } from '../../config/stripe';
import { AppError } from '../../errors/AppError';

const createPaymentIntent = async (userId: string, amount: number) => {
  const amountInCents = Math.round(amount * 100);

  if (amountInCents <= 0) {
    throw new AppError('Amount must be greater than 0', 400);
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: 'usd',
    automatic_payment_methods: {
      enabled: true,
    },
  });

  // store payment (pending)
  await prisma.donation.create({
    data: {
      userId,
      amount,
      paymentStatus: 'PENDING',
      transactionId: paymentIntent.id,
    },
  });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  };
};

const confirmPayment = async (userId: string, paymentIntentId: string) => {
  const donation = await prisma.donation.findFirst({
    where: {
      userId,
      transactionId: paymentIntentId,
    },
  });

  if (!donation) {
    throw new AppError('Payment not found for this user', 404);
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.status !== 'succeeded') {
    throw new AppError('Payment not completed yet', 400);
  }

  return prisma.donation.update({
    where: { id: donation.id },
    data: { paymentStatus: 'SUCCESS' },
  });
};

const handleWebhookEvent = async (event: Stripe.Event) => {
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    await prisma.donation.updateMany({
      where: { transactionId: paymentIntent.id },
      data: { paymentStatus: 'SUCCESS' },
    });
  }

  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    await prisma.donation.updateMany({
      where: { transactionId: paymentIntent.id },
      data: { paymentStatus: 'FAILED' },
    });
  }
};

export const PaymentService = {
  createPaymentIntent,
  confirmPayment,
  handleWebhookEvent,
};