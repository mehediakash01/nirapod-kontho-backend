import { prisma } from "../../config/prisma";
import { buildQueryOptions } from "../../utils/queryBuilder";
import { AppError } from '../../errors/AppError';

import { ICreateReport } from "./report.interface";


const createReport = async (userId: string, payload: ICreateReport) => {
  const report = await prisma.report.create({
    data: {
      userId,
      type: payload.type,
      description: payload.description,
      location: payload.location,
      isAnonymous: payload.isAnonymous ?? false,
    },
  });

  return report;
};

const getMyReports = async (userId: string) => {
  return prisma.report.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
};



const getAllReports = async (query: any) => {
  const { skip, limit } = buildQueryOptions(query);

  const { type, status, search } = query;

  const where: any = {};

  if (type) {
    where.type = type;
  }

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      {
        description: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        location: {
          contains: search,
          mode: 'insensitive',
        },
      },
    ];
  }

  const reports = await prisma.report.findMany({
    where,
    skip,
    take: limit,
    include: {
      case: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const total = await prisma.report.count({ where });

  return {
    meta: {
      total,
      page: Math.ceil(total / limit),
    },
    data: reports,
  };
};

const assignNgoToReport = async (
  reportId: string,
  payload: { ngoId: string; priority?: 'LOW' | 'MEDIUM' | 'HIGH' }
) => {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      case: true,
    },
  });

  if (!report) {
    throw new AppError('Report not found', 404);
  }

  const ngo = await prisma.nGO.findUnique({
    where: { id: payload.ngoId },
  });

  if (!ngo) {
    throw new AppError('NGO not found', 404);
  }

  if (!report.case && report.status !== 'VERIFIED') {
    throw new AppError('Only verified reports can be assigned to NGO', 400);
  }

  const updatedCase = await prisma.$transaction(async (tx) => {
    let caseRecord;

    if (report.case) {
      caseRecord = await tx.case.update({
        where: { reportId },
        data: {
          assignedNgoId: payload.ngoId,
          priority: payload.priority ?? report.case.priority,
        },
      });
    } else {
      caseRecord = await tx.case.create({
        data: {
          reportId,
          assignedNgoId: payload.ngoId,
          status: 'UNDER_REVIEW',
          priority: payload.priority ?? 'HIGH',
        },
      });
    }

    await tx.notification.create({
      data: {
        userId: report.userId,
        message: 'Your verified report has been assigned to an NGO for case handling.',
      },
    });

    return caseRecord;
  });

  return updatedCase;
};

export const ReportService = {
  createReport,
  getMyReports,
  getAllReports,
  assignNgoToReport,
};