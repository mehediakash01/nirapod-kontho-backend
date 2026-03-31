import Stripe from 'stripe';
import { prisma } from '../../config/prisma';
import { stripe } from '../../config/stripe';
import { AppError } from '../../errors/AppError';

const createOrUpdateDonation = async (
  transactionId: string,
  userId: string,
  amount: number,
  paymentStatus: 'PENDING' | 'SUCCESS' | 'FAILED'
) => {
  const existing = await prisma.donation.findFirst({
    where: { transactionId },
  });

  if (existing) {
    return prisma.donation.update({
      where: { id: existing.id },
      data: { paymentStatus },
    });
  }

  return prisma.donation.create({
    data: {
      userId,
      amount,
      paymentStatus,
      transactionId,
    },
  });
};

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

const createMonthlySubscription = async (userId: string, amount: number) => {
  const amountInCents = Math.round(amount * 100);

  if (amountInCents <= 0) {
    throw new AppError('Amount must be greater than 0', 400);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const appUrl = process.env.CLIENT_URL || 'http://localhost:3000';

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name || undefined,
    metadata: {
      userId,
    },
  });

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customer.id,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: amountInCents,
          recurring: {
            interval: 'month',
          },
          product_data: {
            name: 'Monthly Donation Subscription',
          },
        },
      },
    ],
    metadata: {
      userId,
      type: 'MONTHLY_SUBSCRIPTION',
      amount: String(amount),
    },
    subscription_data: {
      metadata: {
        userId,
        type: 'MONTHLY_SUBSCRIPTION',
        amount: String(amount),
      },
    },
    success_url: `${appUrl}/donation/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/donation/cancel`,
  });

  return {
    checkoutUrl: session.url,
    sessionId: session.id,
  };
};

const createOneTimeCheckout = async (userId: string, amount: number) => {
  const amountInCents = Math.round(amount * 100);

  if (amountInCents <= 0) {
    throw new AppError('Amount must be greater than 0', 400);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const appUrl = process.env.CLIENT_URL || 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: user.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: amountInCents,
          product_data: {
            name: 'One-time Donation',
          },
        },
      },
    ],
    metadata: {
      userId,
      type: 'ONE_TIME_DONATION',
      amount: String(amount),
    },
    success_url: `${appUrl}/donation/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/donation/cancel`,
  });

  await createOrUpdateDonation(session.id, userId, amount, 'PENDING');

  return {
    checkoutUrl: session.url,
    sessionId: session.id,
  };
};

const getMyDonations = async (userId: string) => {
  return prisma.donation.findMany({
    where: { userId },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

const getDonationDashboard = async () => {
  const donations = await prisma.donation.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  type DonationWithUser = (typeof donations)[number];

  const totalAmount = donations
    .filter((d: DonationWithUser) => d.paymentStatus === 'SUCCESS')
    .reduce((sum: number, d: DonationWithUser) => sum + d.amount, 0);

  const totalSuccessfulDonations = donations.filter(
    (d: DonationWithUser) => d.paymentStatus === 'SUCCESS'
  ).length;
  const totalPendingDonations = donations.filter(
    (d: DonationWithUser) => d.paymentStatus === 'PENDING'
  ).length;
  const totalFailedDonations = donations.filter(
    (d: DonationWithUser) => d.paymentStatus === 'FAILED'
  ).length;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const thisMonthAmount = donations
    .filter((d: DonationWithUser) => {
      const dt = new Date(d.createdAt);
      return (
        d.paymentStatus === 'SUCCESS' &&
        dt.getFullYear() === year &&
        dt.getMonth() === month
      );
    })
    .reduce((sum: number, d: DonationWithUser) => sum + d.amount, 0);

  const monthlyMap = new Map<string, number>();

  for (let i = 11; i >= 0; i--) {
    const d = new Date(year, month - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyMap.set(key, 0);
  }

  donations.forEach((d: DonationWithUser) => {
    if (d.paymentStatus !== 'SUCCESS') {
      return;
    }

    const dt = new Date(d.createdAt);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
    if (monthlyMap.has(key)) {
      monthlyMap.set(key, (monthlyMap.get(key) || 0) + d.amount);
    }
  });

  const monthlyTrend = Array.from(monthlyMap.entries()).map(([period, amount]) => ({
    period,
    amount,
  }));

  const monthlySubscriptionPayments = donations.filter(
    (d: DonationWithUser) => d.paymentStatus === 'SUCCESS' && d.transactionId.startsWith('in_')
  ).length;

  const recentTransactions = donations.slice(0, 20).map((donation: { id: any; amount: any; paymentStatus: any; transactionId: any; createdAt: any; user: any; }) => ({
    id: donation.id,
    amount: donation.amount,
    paymentStatus: donation.paymentStatus,
    transactionId: donation.transactionId,
    createdAt: donation.createdAt,
    user: donation.user,
  }));

  return {
    summary: {
      totalAmount,
      totalSuccessfulDonations,
      totalPendingDonations,
      totalFailedDonations,
      thisMonthAmount,
      monthlySubscriptionPayments,
    },
    monthlyTrend,
    recentTransactions,
  };
};

const handleWebhookEvent = async (event: Stripe.Event) => {
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;

    if (!userId) {
      return;
    }

    const amount = ((session.amount_total || 0) / 100);
    await createOrUpdateDonation(session.id, userId, amount, 'SUCCESS');
  }

  if (event.type === 'checkout.session.async_payment_failed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;

    if (!userId) {
      return;
    }

    const amount = ((session.amount_total || 0) / 100);
    await createOrUpdateDonation(session.id, userId, amount, 'FAILED');
  }

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

  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as Stripe.Invoice;
    const subscriptionId = (invoice as any).subscription as string | undefined;

    if (!subscriptionId) {
      return;
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const userId = subscription.metadata?.userId;

    if (!userId) {
      return;
    }

    await createOrUpdateDonation(
      invoice.id,
      userId,
      (invoice.amount_paid || 0) / 100,
      'SUCCESS'
    );
  }

  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice;
    const subscriptionId = (invoice as any).subscription as string | undefined;

    if (!subscriptionId) {
      return;
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const userId = subscription.metadata?.userId;

    if (!userId) {
      return;
    }

    await createOrUpdateDonation(
      invoice.id,
      userId,
      (invoice.amount_due || 0) / 100,
      'FAILED'
    );
  }
};

export const PaymentService = {
  createPaymentIntent,
  confirmPayment,
  createMonthlySubscription,
  createOneTimeCheckout,
  getMyDonations,
  getDonationDashboard,
  handleWebhookEvent,
};