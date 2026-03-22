import { prisma } from "../../config/prisma";
import { IVerifyReport } from './verification.interface';
import { AppError } from '../../errors/AppError';


const verifyReport = async (moderatorId: string, payload: IVerifyReport) => {
  const { reportId, status, feedback } = payload;

  if (!reportId) {
    throw new AppError('reportId is required', 400);
  }
  //  transaction to ensure both verification creation and report status update happen together
  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.reportVerification.findUnique({
      where: { reportId },
    });

    if (existing) {
      throw new AppError('Report already verified', 409);
    }

    // 1. create verification
    const verification = await tx.reportVerification.create({
      data: {
        reportId,
        moderatorId,
        status,
        feedback,
      },
    });

    // 2. update report status
    await tx.report.update({
      where: { id: reportId },
      data: {
        status: status === 'APPROVED' ? 'VERIFIED' : 'REJECTED',
      },
    });

    return verification;
  });

  return result;
};

const getPendingReports = async () => {
  return prisma.report.findMany({
    where: {
      status: 'SUBMITTED',
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

export const VerificationService = {
  verifyReport,
  getPendingReports,
};