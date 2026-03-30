import { prisma } from '../../config/prisma';
import { AppError } from '../../errors/AppError';
import { auth } from '../../config/auth';
import { ICreateNGO, ISuperAdminAnalytics } from './ngo.interface';

const createNgoWithAdmin = async (payload: ICreateNGO) => {
  const {
    name,
    email,
    phone,
    address,
    supportedReportTypes,
    coverageAreas,
    maxActiveCases,
    priorityEscalationHours,
    admin,
  } = payload;

  const existingNgo = await prisma.nGO.findUnique({
    where: { email },
  });

  if (existingNgo) {
    throw new AppError('NGO already exists with this email', 400);
  }

  // Run external auth call outside transaction to prevent transaction timeout.
  const userRes = await auth.api.signUpEmail({
    body: {
      email: admin.email,
      password: admin.password,
      name: admin.name,
    },
  });

  if (!userRes?.user?.id) {
    throw new AppError('Failed to create NGO admin user', 500);
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. create NGO
      const ngo = await tx.nGO.create({
        data: {
          name,
          email,
          phone,
          address,
          supportedReportTypes: supportedReportTypes ?? [],
          coverageAreas: (coverageAreas ?? []).map((area) => area.trim()).filter(Boolean),
          maxActiveCases: maxActiveCases ?? 20,
          priorityEscalationHours: priorityEscalationHours ?? 24,
        },
      });

      // 2. update user → assign role + ngoId
      const updatedUser = await tx.user.update({
        where: { id: userRes.user.id },
        data: {
          role: 'NGO_ADMIN',
          ngoId: ngo.id,
        },
      });

      return {
        ngo,
        admin: updatedUser,
      };
    });

    return result;
  } catch (error) {
    // Compensate: remove just-created auth user if NGO transaction fails.
    await prisma.user.delete({
      where: { id: userRes.user.id },
    }).catch(() => undefined);

    throw error;
  }
};



const getAllNgo = async () => {
  return prisma.nGO.findMany({
    include: {
      cases: true,
    },
  });
};

const getSingleNgo = async (id: string) => {
  const ngo = await prisma.nGO.findUnique({
    where: { id },
    include: {
      cases: true,
    },
  });

  if (!ngo) {
    throw new AppError('NGO not found', 404);
  }

  return ngo;
};

const getAnalytics = async (): Promise<ISuperAdminAnalytics> => {
  const [
    totalNgos,
    totalReports,
    submittedReports,
    verifiedReports,
    rejectedReports,
    totalCases,
    activeCases,
    resolvedCases,
    donations,
  ] = await Promise.all([
    prisma.nGO.count(),
    prisma.report.count(),
    prisma.report.count({ where: { status: 'SUBMITTED' } }),
    prisma.report.count({ where: { status: 'VERIFIED' } }),
    prisma.report.count({ where: { status: 'REJECTED' } }),
    prisma.case.count(),
    prisma.case.count({ where: { status: { in: ['UNDER_REVIEW', 'IN_PROGRESS'] } } }),
    prisma.case.count({ where: { status: { in: ['RESOLVED', 'CLOSED'] } } }),
    prisma.donation.findMany({ where: { paymentStatus: 'SUCCESS' }, select: { amount: true } }),
  ]);

  const totalSuccessfulDonations = donations.reduce((sum, donation) => sum + donation.amount, 0);

  return {
    totalNgos,
    totalReports,
    submittedReports,
    verifiedReports,
    rejectedReports,
    totalCases,
    activeCases,
    resolvedCases,
    totalSuccessfulDonations,
  };
};

export const NgoService = {
  createNgoWithAdmin,
  getAllNgo,
  getSingleNgo,
  getAnalytics,
};