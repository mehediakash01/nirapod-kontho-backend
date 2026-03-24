import { prisma } from "../../config/prisma";
import { IVerifyReport } from './verification.interface';
import { AppError } from '../../errors/AppError';
import { NotificationService } from '../notification/notification.service';


const verifyReport = async (moderatorId: string, payload: IVerifyReport) => {
  const { reportId, status, feedback } = payload;


  //  transaction to ensure both verification creation and report status update happen together
  const result = await prisma.$transaction(async (tx) => {


  const report = await tx.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new AppError('Report not found', 404);
    }

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
    await tx.notification.create({
      data: {
        userId: report.userId,
        message: NotificationService.buildVerificationMessage(status),
      },
    });


    //  AUTO CREATE CASE IF APPROVED
    let caseData = null;

    if (status === 'APPROVED') {
      // find any NGO (simple version)
   const ngo = await tx.nGO.findFirst({
  orderBy: {
    cases: {
      _count: 'asc',
    },
  },
});

      if (!ngo) {
        throw new AppError('No NGO available', 500);
      }

      caseData = await tx.case.create({
        data: {
          reportId,
          assignedNgoId: ngo.id,
          status: 'UNDER_REVIEW',
          priority: 'HIGH',
        },
      });
    }

    return {
      verification,
      case: caseData,
    };
  });

  return result;
};
;

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