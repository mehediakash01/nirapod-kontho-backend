import { prisma } from "../../config/prisma";
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

const getAllReports = async () => {
  return prisma.report.findMany({
    orderBy: { createdAt: 'desc' },
  });
};

export const ReportService = {
  createReport,
  getMyReports,
  getAllReports,
};