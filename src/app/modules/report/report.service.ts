import { prisma } from "../../config/prisma";
import { Prisma } from '@prisma/client';
import { buildQueryOptions } from "../../utils/queryBuilder";
import { AppError } from '../../errors/AppError';

import { ICreateReport } from "./report.interface";

type NgoRecommendationSource = {
  id: string;
  name: string;
  supportedReportTypes: string[];
  coverageAreas: string[];
  maxActiveCases: number;
  priorityEscalationHours: number;
  cases: Array<{
    id: string;
    status: string;
  }>;
};

type AssignmentRecommendation = {
  ngoId: string;
  ngoName: string;
  score: number;
  reasons: string[];
  activeCases: number;
  maxActiveCases: number;
  priorityEscalationHours: number;
  typeMatched: boolean;
  coverageMatched: boolean;
};


const createReport = async (userId: string, payload: ICreateReport) => {
  const report = await prisma.report.create({
    data: {
      userId,
      type: payload.type,
      description: payload.description,
      location: payload.location,
      incidentDate: payload.incidentDate,
      severity: payload.severity,
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
      voiceNoteUrl: payload.voiceNoteUrl,
      isAnonymous: payload.isAnonymous ?? false,
      evidence:
        payload.evidenceFiles && payload.evidenceFiles.length > 0
          ? {
              create: payload.evidenceFiles.map((file) => ({
                fileUrl: file.fileUrl,
                fileType: file.fileType,
              })),
            }
          : undefined,
    },
    include: {
      evidence: true,
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
  payload: {
    ngoId: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    assignmentRationale: string;
    confirmAssignment: true;
  },
  actorUserId?: string
) => {
  if (!payload.confirmAssignment) {
    throw new AppError('Assignment confirmation is required', 400);
  }

  if (!payload.assignmentRationale || payload.assignmentRationale.trim().length < 10) {
    throw new AppError('assignmentRationale must be at least 10 characters', 400);
  }

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

  const updatedCase = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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

    await tx.auditLog.create({
      data: {
        actorUserId,
        category: 'REPORT_ASSIGNMENT',
        action: report.case ? 'REASSIGN_NGO' : 'ASSIGN_NGO',
        entityType: 'REPORT',
        entityId: reportId,
        severity: (payload.priority ?? 'HIGH') === 'HIGH' ? 'ALERT' : 'INFO',
        message: report.case
          ? 'Super admin reassigned NGO for verified report.'
          : 'Super admin assigned NGO for verified report.',
        rationale: payload.assignmentRationale.trim(),
        metadata: {
          ngoId: payload.ngoId,
          caseId: caseRecord.id,
          priority: caseRecord.priority,
        },
      },
    });

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

const getAssignmentRecommendations = async (reportId: string) => {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
  });

  if (!report) {
    throw new AppError('Report not found', 404);
  }

  if (report.status !== 'VERIFIED') {
    throw new AppError('Recommendations are available only for verified reports', 400);
  }

  const ngos = await prisma.nGO.findMany({
    include: {
      cases: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  const location = report.location.toLowerCase();

  const recommendations = (ngos as NgoRecommendationSource[]).map((ngo: NgoRecommendationSource) => {
    const activeCases = ngo.cases.filter(
      (item: { id: string; status: string }) =>
        item.status === 'UNDER_REVIEW' || item.status === 'IN_PROGRESS'
    ).length;
    const resolvedCases = ngo.cases.filter(
      (item: { id: string; status: string }) =>
        item.status === 'RESOLVED' || item.status === 'CLOSED'
    ).length;

    const typeMatched =
      ngo.supportedReportTypes.length === 0 || ngo.supportedReportTypes.includes(report.type);
    const coverageMatched =
      ngo.coverageAreas.length === 0 ||
      ngo.coverageAreas.some((area: string) => location.includes(area.toLowerCase()));

    const capacityRatio = Math.max(0, (ngo.maxActiveCases - activeCases) / Math.max(ngo.maxActiveCases, 1));
    const capacityScore = Math.round(capacityRatio * 30);

    const urgencyScore =
      report.severity === 'URGENT'
        ? ngo.priorityEscalationHours <= 12
          ? 20
          : ngo.priorityEscalationHours <= 24
            ? 12
            : 5
        : report.severity === 'MODERATE'
          ? 8
          : 5;

    let score = 0;
    score += typeMatched ? 35 : -15;
    score += coverageMatched ? 15 : -5;
    score += capacityScore;
    score += urgencyScore;
    score += Math.min(10, resolvedCases * 2);

    const reasons = [
      typeMatched
        ? 'Specialization aligns with report type'
        : 'Specialization mismatch for this report type',
      coverageMatched ? 'Coverage area matches report location' : 'Coverage area does not explicitly match',
      `Active load ${activeCases}/${ngo.maxActiveCases}`,
      `Escalation SLA ${ngo.priorityEscalationHours}h`,
    ];

    return {
      ngoId: ngo.id,
      ngoName: ngo.name,
      score,
      reasons,
      activeCases,
      maxActiveCases: ngo.maxActiveCases,
      priorityEscalationHours: ngo.priorityEscalationHours,
      typeMatched,
      coverageMatched,
    };
  });

  return recommendations.sort(
    (a: AssignmentRecommendation, b: AssignmentRecommendation) => b.score - a.score
  );
};

const getAssignmentAuditLogs = async () => {
  return prisma.auditLog.findMany({
    where: {
      category: 'REPORT_ASSIGNMENT',
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 100,
  });
};

export const ReportService = {
  createReport,
  getMyReports,
  getAllReports,
  assignNgoToReport,
  getAssignmentRecommendations,
  getAssignmentAuditLogs,
};