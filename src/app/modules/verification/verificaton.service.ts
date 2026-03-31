import { prisma } from "../../config/prisma";
import { IVerifyReport } from './verification.interface';
import { AppError } from '../../errors/AppError';
import { NotificationService } from '../notification/notification.service';
import { Prisma } from "@prisma/client";


const verifyReport = async (moderatorId: string, payload: IVerifyReport) => {
  const { reportId, status, feedback, rejectionReason, checklist } = payload;

  if (status === 'REJECTED' && !rejectionReason) {
    throw new AppError('rejectionReason is required when rejecting a report', 400);
  }

  const feedbackParts: string[] = [];
  if (status === 'REJECTED' && rejectionReason) {
    feedbackParts.push(`Rejection reason: ${rejectionReason}`);
  }
  if (checklist && checklist.length > 0) {
    feedbackParts.push(`Checklist: ${checklist.join(', ')}`);
  }
  if (feedback) {
    feedbackParts.push(`Moderator note: ${feedback}`);
  }
  const normalizedFeedback = feedbackParts.length > 0 ? feedbackParts.join('\n') : undefined;


  //  transaction to ensure both verification creation and report status update happen together
  const result = await prisma.$transaction(async (tx:Prisma.TransactionClient) => {


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
        feedback: normalizedFeedback,
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


    // Keep approved reports unassigned until SUPER_ADMIN performs explicit NGO assignment.
    let caseData = null;

    return {
      verification,
      case: caseData,
    };
  });

  return result;
};
;

const getPendingReports = async () => {
  const reports = await prisma.report.findMany({
    where: {
      status: 'SUBMITTED',
    },
    include: {
      evidence: {
        orderBy: {
          createdAt: 'desc',
        },
      },
      user: {
        select: {
          id: true,
          _count: {
            select: {
              reports: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return reports.map((report: { user: { _count: { reports: any; }; }; }) => {
    const previousReportsCount = Math.max((report.user?._count.reports ?? 1) - 1, 0);
    return {
      ...report,
      reporterInsight: {
        previousReportsCount,
        label:
          previousReportsCount === 0
            ? 'First time reporter'
            : `Previous reports: ${previousReportsCount}`,
      },
    };
  });
};

const getOverview = async (moderatorId: string) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [pendingCount, urgentPendingCount, approvedByMe, rejectedByMe, reviewedTodayByMe] =
    await Promise.all([
      prisma.report.count({ where: { status: 'SUBMITTED' } }),
      prisma.report.count({
        where: { status: 'SUBMITTED', severity: 'URGENT' },
      }),
      prisma.reportVerification.count({
        where: { moderatorId, status: 'APPROVED' },
      }),
      prisma.reportVerification.count({
        where: { moderatorId, status: 'REJECTED' },
      }),
      prisma.reportVerification.count({
        where: {
          moderatorId,
          createdAt: {
            gte: todayStart,
          },
        },
      }),
    ]);

  return {
    pendingCount,
    urgentPendingCount,
    approvedByMe,
    rejectedByMe,
    reviewedTodayByMe,
  };
};

const getRecentDecisions = async (moderatorId: string) => {
  return prisma.reportVerification.findMany({
    where: { moderatorId },
    include: {
      report: {
        select: {
          id: true,
          type: true,
          severity: true,
          location: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 30,
  });
};

export const VerificationService = {
  verifyReport,
  getPendingReports,
  getOverview,
  getRecentDecisions,
};