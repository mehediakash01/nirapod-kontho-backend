import { prisma } from "../../config/prisma";
import { buildQueryOptions } from "../../utils/querybuilder";
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

export const ReportService = {
  createReport,
  getMyReports,
  getAllReports,
};