// src/server.ts
import dotenv from "dotenv";

// src/app.ts
import express7 from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

// src/app/middleware/globalErrorHandler.ts
var globalErrorHandler = (err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    error: err
  });
  console.error(err);
};

// src/app/config/auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";

// src/app/config/prisma.ts
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
var globalForPrisma = globalThis;
var connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}
var adapter = globalForPrisma.prismaAdapter ?? new PrismaPg({
  connectionString
});
var prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
});
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaAdapter = adapter;
  globalForPrisma.prisma = prisma;
}

// src/app/config/auth.ts
var auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [
    process.env.FRONTEND_URL || "https://nirapod-kontho-frontend.vercel.app",
    process.env.CLIENT_URL || "https://nirapod-kontho-frontend.vercel.app",
    process.env.BETTER_AUTH_URL || "http://localhost:5000",
    "https://nirapod-kontho-frontend.vercel.app",
    "http://localhost:3000",
    "http://localhost:5000"
  ],
  database: prismaAdapter(prisma, {
    provider: "postgresql"
  }),
  emailAndPassword: {
    enabled: true
  },
  socialProviders: {
    google: {
      enabled: true,
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || ""
    }
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7
    // 7 days
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        input: false
      }
    }
  }
});

// src/app.ts
import { toNodeHandler } from "better-auth/node";

// src/app/modules/report/report.route.ts
import express from "express";

// src/app/middleware/auth.ts
var authenticate = async (req, res, next) => {
  const session = await auth.api.getSession({
    headers: req.headers
  });
  if (!session) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized"
    });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  });
  req.user = user;
  next();
};
var requireRole = (...roles) => {
  return (req, res, next) => {
    const user = req.user;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden"
      });
    }
    next();
  };
};

// src/app/middleware/validationRequest.ts
import { ZodError } from "zod";
var validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
          success: false,
          message: "Request body is empty or Content-Type is not application/json"
        });
      }
      const parsed = schema.parse(req.body);
      req.body = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation Error",
          error: err.issues
        });
      }
      res.status(400).json({
        success: false,
        message: "Validation Error",
        error: err
      });
    }
  };
};

// src/app/utils/catchAsync.ts
var catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// src/app/utils/sendResponse.ts
var sendResponse = (res, {
  statusCode = 200,
  success = true,
  message = "",
  meta,
  data = void 0
}) => {
  res.status(statusCode).json({
    success,
    message,
    meta,
    data
  });
};

// src/app/utils/queryBuilder.ts
var buildQueryOptions = (query) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;
  return {
    page,
    limit,
    skip
  };
};

// src/app/errors/AppError.ts
var AppError = class extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
};

// src/app/modules/report/report.service.ts
var createReport = async (userId, payload) => {
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
      evidence: payload.evidenceFiles && payload.evidenceFiles.length > 0 ? {
        create: payload.evidenceFiles.map((file) => ({
          fileUrl: file.fileUrl,
          fileType: file.fileType
        }))
      } : void 0
    },
    include: {
      evidence: true
    }
  });
  return report;
};
var getMyReports = async (userId) => {
  return prisma.report.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });
};
var getAllReports = async (query) => {
  const { skip, limit } = buildQueryOptions(query);
  const { type, status, search } = query;
  const where = {};
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
          mode: "insensitive"
        }
      },
      {
        location: {
          contains: search,
          mode: "insensitive"
        }
      }
    ];
  }
  const reports = await prisma.report.findMany({
    where,
    skip,
    take: limit,
    include: {
      case: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });
  const total = await prisma.report.count({ where });
  return {
    meta: {
      total,
      page: Math.ceil(total / limit)
    },
    data: reports
  };
};
var assignNgoToReport = async (reportId, payload, actorUserId) => {
  if (!payload.confirmAssignment) {
    throw new AppError("Assignment confirmation is required", 400);
  }
  if (!payload.assignmentRationale || payload.assignmentRationale.trim().length < 10) {
    throw new AppError("assignmentRationale must be at least 10 characters", 400);
  }
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      case: true
    }
  });
  if (!report) {
    throw new AppError("Report not found", 404);
  }
  const ngo = await prisma.nGO.findUnique({
    where: { id: payload.ngoId }
  });
  if (!ngo) {
    throw new AppError("NGO not found", 404);
  }
  if (!report.case && report.status !== "VERIFIED") {
    throw new AppError("Only verified reports can be assigned to NGO", 400);
  }
  const updatedCase = await prisma.$transaction(async (tx) => {
    let caseRecord;
    if (report.case) {
      caseRecord = await tx.case.update({
        where: { reportId },
        data: {
          assignedNgoId: payload.ngoId,
          priority: payload.priority ?? report.case.priority
        }
      });
    } else {
      caseRecord = await tx.case.create({
        data: {
          reportId,
          assignedNgoId: payload.ngoId,
          status: "UNDER_REVIEW",
          priority: payload.priority ?? "HIGH"
        }
      });
    }
    await tx.auditLog.create({
      data: {
        actorUserId,
        category: "REPORT_ASSIGNMENT",
        action: report.case ? "REASSIGN_NGO" : "ASSIGN_NGO",
        entityType: "REPORT",
        entityId: reportId,
        severity: (payload.priority ?? "HIGH") === "HIGH" ? "ALERT" : "INFO",
        message: report.case ? "Super admin reassigned NGO for verified report." : "Super admin assigned NGO for verified report.",
        rationale: payload.assignmentRationale.trim(),
        metadata: {
          ngoId: payload.ngoId,
          caseId: caseRecord.id,
          priority: caseRecord.priority
        }
      }
    });
    await tx.notification.create({
      data: {
        userId: report.userId,
        message: "Your verified report has been assigned to an NGO for case handling."
      }
    });
    return caseRecord;
  });
  return updatedCase;
};
var getAssignmentRecommendations = async (reportId) => {
  const report = await prisma.report.findUnique({
    where: { id: reportId }
  });
  if (!report) {
    throw new AppError("Report not found", 404);
  }
  if (report.status !== "VERIFIED") {
    throw new AppError("Recommendations are available only for verified reports", 400);
  }
  const ngos = await prisma.nGO.findMany({
    include: {
      cases: {
        select: {
          id: true,
          status: true
        }
      }
    }
  });
  const location = report.location.toLowerCase();
  const recommendations = ngos.map((ngo) => {
    const activeCases = ngo.cases.filter(
      (item) => item.status === "UNDER_REVIEW" || item.status === "IN_PROGRESS"
    ).length;
    const resolvedCases = ngo.cases.filter(
      (item) => item.status === "RESOLVED" || item.status === "CLOSED"
    ).length;
    const typeMatched = ngo.supportedReportTypes.length === 0 || ngo.supportedReportTypes.includes(report.type);
    const coverageMatched = ngo.coverageAreas.length === 0 || ngo.coverageAreas.some((area) => location.includes(area.toLowerCase()));
    const capacityRatio = Math.max(0, (ngo.maxActiveCases - activeCases) / Math.max(ngo.maxActiveCases, 1));
    const capacityScore = Math.round(capacityRatio * 30);
    const urgencyScore = report.severity === "URGENT" ? ngo.priorityEscalationHours <= 12 ? 20 : ngo.priorityEscalationHours <= 24 ? 12 : 5 : report.severity === "MODERATE" ? 8 : 5;
    let score = 0;
    score += typeMatched ? 35 : -15;
    score += coverageMatched ? 15 : -5;
    score += capacityScore;
    score += urgencyScore;
    score += Math.min(10, resolvedCases * 2);
    const reasons = [
      typeMatched ? "Specialization aligns with report type" : "Specialization mismatch for this report type",
      coverageMatched ? "Coverage area matches report location" : "Coverage area does not explicitly match",
      `Active load ${activeCases}/${ngo.maxActiveCases}`,
      `Escalation SLA ${ngo.priorityEscalationHours}h`
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
      coverageMatched
    };
  });
  return recommendations.sort(
    (a, b) => b.score - a.score
  );
};
var getAssignmentAuditLogs = async () => {
  return prisma.auditLog.findMany({
    where: {
      category: "REPORT_ASSIGNMENT"
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 100
  });
};
var ReportService = {
  createReport,
  getMyReports,
  getAllReports,
  assignNgoToReport,
  getAssignmentRecommendations,
  getAssignmentAuditLogs
};

// src/app/modules/notification/notification.service.ts
var createNotification = async (userId, message) => {
  return prisma.notification.create({
    data: {
      userId,
      message
    }
  });
};
var getMyNotifications = async (userId) => {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });
};
var markAsRead = async (id, userId) => {
  const notification = await prisma.notification.findUnique({
    where: { id }
  });
  if (!notification) {
    throw new AppError("Notification not found", 404);
  }
  if (notification.userId !== userId) {
    throw new AppError("Cannot update notification of another user", 403);
  }
  return prisma.notification.update({
    where: { id },
    data: {
      isRead: true
    }
  });
};
var buildVerificationMessage = (status) => {
  return status === "APPROVED" ? "Your report has been verified and is awaiting NGO assignment." : "Your report has been rejected.";
};
var NotificationService = {
  createNotification,
  getMyNotifications,
  markAsRead,
  buildVerificationMessage
};

// src/app/modules/verification/verificaton.service.ts
var verifyReport = async (moderatorId, payload) => {
  const { reportId, status, feedback, rejectionReason, checklist } = payload;
  if (status === "REJECTED" && !rejectionReason) {
    throw new AppError("rejectionReason is required when rejecting a report", 400);
  }
  const feedbackParts = [];
  if (status === "REJECTED" && rejectionReason) {
    feedbackParts.push(`Rejection reason: ${rejectionReason}`);
  }
  if (checklist && checklist.length > 0) {
    feedbackParts.push(`Checklist: ${checklist.join(", ")}`);
  }
  if (feedback) {
    feedbackParts.push(`Moderator note: ${feedback}`);
  }
  const normalizedFeedback = feedbackParts.length > 0 ? feedbackParts.join("\n") : void 0;
  const result = await prisma.$transaction(async (tx) => {
    const report = await tx.report.findUnique({
      where: { id: reportId }
    });
    if (!report) {
      throw new AppError("Report not found", 404);
    }
    const existing = await tx.reportVerification.findUnique({
      where: { reportId }
    });
    if (existing) {
      throw new AppError("Report already verified", 409);
    }
    const verification = await tx.reportVerification.create({
      data: {
        reportId,
        moderatorId,
        status,
        feedback: normalizedFeedback
      }
    });
    await tx.report.update({
      where: { id: reportId },
      data: {
        status: status === "APPROVED" ? "VERIFIED" : "REJECTED"
      }
    });
    await tx.notification.create({
      data: {
        userId: report.userId,
        message: NotificationService.buildVerificationMessage(status)
      }
    });
    let caseData = null;
    return {
      verification,
      case: caseData
    };
  });
  return result;
};
var getPendingReports = async () => {
  const reports = await prisma.report.findMany({
    where: {
      status: "SUBMITTED"
    },
    include: {
      evidence: {
        orderBy: {
          createdAt: "desc"
        }
      },
      user: {
        select: {
          id: true,
          _count: {
            select: {
              reports: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });
  return reports.map((report) => {
    const previousReportsCount = Math.max((report.user?._count.reports ?? 1) - 1, 0);
    return {
      ...report,
      reporterInsight: {
        previousReportsCount,
        label: previousReportsCount === 0 ? "First time reporter" : `Previous reports: ${previousReportsCount}`
      }
    };
  });
};
var getOverview = async (moderatorId) => {
  const todayStart = /* @__PURE__ */ new Date();
  todayStart.setHours(0, 0, 0, 0);
  const [pendingCount, urgentPendingCount, approvedByMe, rejectedByMe, reviewedTodayByMe] = await Promise.all([
    prisma.report.count({ where: { status: "SUBMITTED" } }),
    prisma.report.count({
      where: { status: "SUBMITTED", severity: "URGENT" }
    }),
    prisma.reportVerification.count({
      where: { moderatorId, status: "APPROVED" }
    }),
    prisma.reportVerification.count({
      where: { moderatorId, status: "REJECTED" }
    }),
    prisma.reportVerification.count({
      where: {
        moderatorId,
        createdAt: {
          gte: todayStart
        }
      }
    })
  ]);
  return {
    pendingCount,
    urgentPendingCount,
    approvedByMe,
    rejectedByMe,
    reviewedTodayByMe
  };
};
var getRecentDecisions = async (moderatorId) => {
  return prisma.reportVerification.findMany({
    where: { moderatorId },
    include: {
      report: {
        select: {
          id: true,
          type: true,
          severity: true,
          location: true,
          createdAt: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 30
  });
};
var VerificationService = {
  verifyReport,
  getPendingReports,
  getOverview,
  getRecentDecisions
};

// src/app/modules/report/report.controller.ts
var createReport2 = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const result = await ReportService.createReport(userId, req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Report created successfully",
    data: result
  });
});
var getMyReports2 = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const result = await ReportService.getMyReports(userId);
  sendResponse(res, {
    success: true,
    message: "My reports fetched",
    data: result
  });
});
var getAllReports2 = catchAsync(async (req, res) => {
  const result = await ReportService.getAllReports(req.query);
  sendResponse(res, {
    success: true,
    message: "Reports fetched",
    meta: result.meta,
    data: result.data
  });
});
var getPendingReports2 = catchAsync(async (req, res) => {
  const result = await VerificationService.getPendingReports();
  sendResponse(res, {
    success: true,
    message: "Pending reports fetched",
    data: result
  });
});
var updateReportStatus = catchAsync(async (req, res) => {
  const moderatorId = req.user.id;
  const { id } = req.params;
  const { status, note } = req.body;
  const result = await VerificationService.verifyReport(moderatorId, {
    reportId: id,
    status,
    feedback: note
  });
  sendResponse(res, {
    success: true,
    message: "Report status updated successfully",
    data: result
  });
});
var assignNgoToReport2 = catchAsync(async (req, res) => {
  const { id } = req.params;
  if (!id || Array.isArray(id)) {
    throw new AppError("Invalid report id", 400);
  }
  const actorUserId = req.user?.id;
  const result = await ReportService.assignNgoToReport(id, req.body, actorUserId);
  sendResponse(res, {
    success: true,
    message: "NGO assigned to report successfully",
    data: result
  });
});
var getAssignmentRecommendations2 = catchAsync(async (req, res) => {
  const { id } = req.params;
  if (!id || Array.isArray(id)) {
    throw new AppError("Invalid report id", 400);
  }
  const result = await ReportService.getAssignmentRecommendations(id);
  sendResponse(res, {
    success: true,
    message: "Assignment recommendations fetched successfully",
    data: result
  });
});
var getAssignmentAuditLogs2 = catchAsync(async (_req, res) => {
  const result = await ReportService.getAssignmentAuditLogs();
  sendResponse(res, {
    success: true,
    message: "Assignment audit logs fetched successfully",
    data: result
  });
});
var ReportController = {
  createReport: createReport2,
  getMyReports: getMyReports2,
  getAllReports: getAllReports2,
  getPendingReports: getPendingReports2,
  updateReportStatus,
  assignNgoToReport: assignNgoToReport2,
  getAssignmentRecommendations: getAssignmentRecommendations2,
  getAssignmentAuditLogs: getAssignmentAuditLogs2
};

// src/app/modules/report/report.validation.ts
import { z } from "zod";
var optionalNumberField = z.preprocess(
  (value) => value === "" || value === null || value === void 0 ? void 0 : value,
  z.coerce.number().optional()
);
var cloudinaryUrlValidator = z.string().url("Must be a valid Cloudinary URL").optional();
var createReportSchema = z.object({
  type: z.enum([
    "HARASSMENT",
    "DOMESTIC_VIOLENCE",
    "STALKING",
    "CORRUPTION",
    "THREAT"
  ]),
  description: z.string().min(10, "Description too short"),
  location: z.string().min(3),
  incidentDate: z.coerce.date({
    error: "Incident date and time is required"
  }),
  severity: z.enum(["MILD", "MODERATE", "URGENT"]),
  latitude: optionalNumberField.refine(
    (value) => value === void 0 || value >= -90 && value <= 90,
    "Latitude must be between -90 and 90"
  ),
  longitude: optionalNumberField.refine(
    (value) => value === void 0 || value >= -180 && value <= 180,
    "Longitude must be between -180 and 180"
  ),
  voiceNoteUrl: cloudinaryUrlValidator,
  evidenceFiles: z.array(
    z.object({
      fileUrl: z.string().url("Must be a valid Cloudinary URL"),
      fileType: z.string().min(1, "fileType is required")
    })
  ).max(5, "Maximum 5 evidence files are allowed").optional(),
  isAnonymous: z.coerce.boolean().optional()
});
var updateReportStatusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  note: z.string().optional()
});
var assignReportSchema = z.object({
  ngoId: z.string().min(1, "ngoId is required"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  assignmentRationale: z.string().min(10, "assignmentRationale must be at least 10 characters"),
  confirmAssignment: z.literal(true)
});

// src/app/modules/report/report.route.ts
var router = express.Router();
router.post(
  "/",
  authenticate,
  validateRequest(createReportSchema),
  ReportController.createReport
);
router.get(
  "/my",
  authenticate,
  ReportController.getMyReports
);
router.get(
  "/pending",
  authenticate,
  requireRole("SUPER_ADMIN", "MODERATOR"),
  ReportController.getPendingReports
);
router.patch(
  "/:id/status",
  authenticate,
  requireRole("SUPER_ADMIN", "MODERATOR"),
  validateRequest(updateReportStatusSchema),
  ReportController.updateReportStatus
);
router.patch(
  "/:id/assign",
  authenticate,
  requireRole("SUPER_ADMIN"),
  validateRequest(assignReportSchema),
  ReportController.assignNgoToReport
);
router.get(
  "/:id/recommendations",
  authenticate,
  requireRole("SUPER_ADMIN"),
  ReportController.getAssignmentRecommendations
);
router.get(
  "/audit-logs/assignments",
  authenticate,
  requireRole("SUPER_ADMIN"),
  ReportController.getAssignmentAuditLogs
);
router.get(
  "/",
  authenticate,
  requireRole("SUPER_ADMIN", "MODERATOR"),
  ReportController.getAllReports
);
var ReportRoutes = router;

// src/app/modules/verification/verification.route.ts
import express2 from "express";

// src/app/modules/verification/verificaiton.controller.ts
var verifyReport2 = catchAsync(async (req, res) => {
  const moderatorId = req.user.id;
  const result = await VerificationService.verifyReport(
    moderatorId,
    req.body
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Report verification completed",
    data: result
  });
});
var getPendingReports3 = catchAsync(async (req, res) => {
  const result = await VerificationService.getPendingReports();
  sendResponse(res, {
    success: true,
    message: "Pending reports fetched",
    data: result
  });
});
var getOverview2 = catchAsync(async (req, res) => {
  const moderatorId = req.user.id;
  const result = await VerificationService.getOverview(moderatorId);
  sendResponse(res, {
    success: true,
    message: "Verification overview fetched",
    data: result
  });
});
var getRecentDecisions2 = catchAsync(async (req, res) => {
  const moderatorId = req.user.id;
  const result = await VerificationService.getRecentDecisions(moderatorId);
  sendResponse(res, {
    success: true,
    message: "Recent verification decisions fetched",
    data: result
  });
});
var VerificationController = {
  verifyReport: verifyReport2,
  getPendingReports: getPendingReports3,
  getOverview: getOverview2,
  getRecentDecisions: getRecentDecisions2
};

// src/app/modules/verification/verification.validation.ts
import { z as z2 } from "zod";
var verifyReportSchema = z2.object({
  reportId: z2.string().min(1, "reportId is required"),
  status: z2.enum(["APPROVED", "REJECTED"]),
  feedback: z2.string().optional(),
  rejectionReason: z2.enum([
    "INSUFFICIENT_EVIDENCE",
    "INCONSISTENT_DETAILS",
    "DUPLICATE_REPORT",
    "OUT_OF_SCOPE",
    "POTENTIAL_SPAM",
    "OTHER"
  ]).optional(),
  checklist: z2.array(z2.string().min(1)).max(10).optional()
});

// src/app/modules/verification/verification.route.ts
var router2 = express2.Router();
router2.get(
  "/pending",
  authenticate,
  requireRole("MODERATOR", "SUPER_ADMIN"),
  VerificationController.getPendingReports
);
router2.get(
  "/overview",
  authenticate,
  requireRole("MODERATOR", "SUPER_ADMIN"),
  VerificationController.getOverview
);
router2.get(
  "/recent",
  authenticate,
  requireRole("MODERATOR", "SUPER_ADMIN"),
  VerificationController.getRecentDecisions
);
router2.post(
  "/",
  authenticate,
  requireRole("MODERATOR", "SUPER_ADMIN"),
  validateRequest(verifyReportSchema),
  VerificationController.verifyReport
);
var VerificationRoutes = router2;

// src/app/modules/ngo/ngo.route.ts
import express3 from "express";

// src/app/modules/ngo/ngo.service.ts
var createNgoWithAdmin = async (payload) => {
  const {
    name,
    email,
    phone,
    address,
    supportedReportTypes,
    coverageAreas,
    maxActiveCases,
    priorityEscalationHours,
    admin
  } = payload;
  const existingNgo = await prisma.nGO.findUnique({
    where: { email }
  });
  if (existingNgo) {
    throw new AppError("NGO already exists with this email", 400);
  }
  const userRes = await auth.api.signUpEmail({
    body: {
      email: admin.email,
      password: admin.password,
      name: admin.name
    }
  });
  if (!userRes?.user?.id) {
    throw new AppError("Failed to create NGO admin user", 500);
  }
  try {
    const result = await prisma.$transaction(async (tx) => {
      const ngo = await tx.nGO.create({
        data: {
          name,
          email,
          phone,
          address,
          supportedReportTypes: supportedReportTypes ?? [],
          coverageAreas: (coverageAreas ?? []).map((area) => area.trim()).filter(Boolean),
          maxActiveCases: maxActiveCases ?? 20,
          priorityEscalationHours: priorityEscalationHours ?? 24
        }
      });
      const updatedUser = await tx.user.update({
        where: { id: userRes.user.id },
        data: {
          role: "NGO_ADMIN",
          ngoId: ngo.id
        }
      });
      return {
        ngo,
        admin: updatedUser
      };
    });
    return result;
  } catch (error) {
    await prisma.user.delete({
      where: { id: userRes.user.id }
    }).catch(() => void 0);
    throw error;
  }
};
var getAllNgo = async () => {
  return prisma.nGO.findMany({
    include: {
      cases: true
    }
  });
};
var getSingleNgo = async (id) => {
  const ngo = await prisma.nGO.findUnique({
    where: { id },
    include: {
      cases: true
    }
  });
  if (!ngo) {
    throw new AppError("NGO not found", 404);
  }
  return ngo;
};
var getAnalytics = async () => {
  const [
    totalNgos,
    totalReports,
    submittedReports,
    verifiedReports,
    rejectedReports,
    totalCases,
    activeCases,
    resolvedCases,
    donations
  ] = await Promise.all([
    prisma.nGO.count(),
    prisma.report.count(),
    prisma.report.count({ where: { status: "SUBMITTED" } }),
    prisma.report.count({ where: { status: "VERIFIED" } }),
    prisma.report.count({ where: { status: "REJECTED" } }),
    prisma.case.count(),
    prisma.case.count({ where: { status: { in: ["UNDER_REVIEW", "IN_PROGRESS"] } } }),
    prisma.case.count({ where: { status: { in: ["RESOLVED", "CLOSED"] } } }),
    prisma.donation.findMany({ where: { paymentStatus: "SUCCESS" }, select: { amount: true } })
  ]);
  const totalSuccessfulDonations = donations.reduce(
    (sum, donation) => sum + donation.amount,
    0
  );
  return {
    totalNgos,
    totalReports,
    submittedReports,
    verifiedReports,
    rejectedReports,
    totalCases,
    activeCases,
    resolvedCases,
    totalSuccessfulDonations
  };
};
var NgoService = {
  createNgoWithAdmin,
  getAllNgo,
  getSingleNgo,
  getAnalytics
};

// src/app/modules/ngo/ngo.controllter.ts
var createNgoWithAdmin2 = catchAsync(async (req, res) => {
  const result = await NgoService.createNgoWithAdmin(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "NGO and Admin created successfully",
    data: result
  });
});
var getAllNgo2 = catchAsync(async (req, res) => {
  const result = await NgoService.getAllNgo();
  sendResponse(res, {
    success: true,
    message: "NGOs fetched successfully",
    data: result
  });
});
var getSingleNgo2 = catchAsync(async (req, res) => {
  const { id } = req.params;
  if (!id || Array.isArray(id)) {
    throw new AppError("Invalid NGO id", 400);
  }
  const result = await NgoService.getSingleNgo(id);
  sendResponse(res, {
    success: true,
    message: "NGO fetched successfully",
    data: result
  });
});
var getAnalytics2 = catchAsync(async (req, res) => {
  const result = await NgoService.getAnalytics();
  sendResponse(res, {
    success: true,
    message: "Super admin analytics fetched successfully",
    data: result
  });
});
var NgoController = {
  createNgoWithAdmin: createNgoWithAdmin2,
  getAllNgo: getAllNgo2,
  getSingleNgo: getSingleNgo2,
  getAnalytics: getAnalytics2
};

// src/app/modules/ngo/ngo.validation.ts
import { z as z3 } from "zod";
var createNgoWithAdminSchema = z3.object({
  name: z3.string().min(3),
  email: z3.string().email(),
  phone: z3.string().min(5),
  address: z3.string().min(5),
  supportedReportTypes: z3.array(
    z3.enum(["HARASSMENT", "DOMESTIC_VIOLENCE", "STALKING", "CORRUPTION", "THREAT"])
  ).optional(),
  coverageAreas: z3.array(z3.string().min(2)).optional(),
  maxActiveCases: z3.coerce.number().int().min(1).max(500).optional(),
  priorityEscalationHours: z3.coerce.number().int().min(1).max(168).optional(),
  admin: z3.object({
    name: z3.string(),
    email: z3.string().email(),
    password: z3.string().min(6)
  })
});

// src/app/modules/ngo/ngo.route.ts
var router3 = express3.Router();
router3.post(
  "/create-with-admin",
  authenticate,
  requireRole("SUPER_ADMIN"),
  validateRequest(createNgoWithAdminSchema),
  NgoController.createNgoWithAdmin
);
router3.get(
  "/",
  authenticate,
  requireRole("NGO_ADMIN", "MODERATOR", "SUPER_ADMIN"),
  NgoController.getAllNgo
);
router3.get(
  "/analytics/summary",
  authenticate,
  requireRole("SUPER_ADMIN"),
  NgoController.getAnalytics
);
router3.get(
  "/:id",
  authenticate,
  requireRole("NGO_ADMIN", "MODERATOR", "SUPER_ADMIN"),
  NgoController.getSingleNgo
);
var NgoRoutes = router3;

// src/app/modules/case/case.route.ts
import express4 from "express";

// src/app/modules/case/case.service.ts
var getMyCases = async (user, query) => {
  const { skip, limit } = buildQueryOptions(query);
  const where = {
    assignedNgoId: user.ngoId
  };
  if (query.status) {
    where.status = query.status;
  }
  const cases = await prisma.case.findMany({
    where,
    skip,
    take: limit,
    include: {
      report: {
        include: {
          evidence: {
            orderBy: {
              createdAt: "desc"
            }
          }
        }
      },
      notes: {
        orderBy: {
          createdAt: "desc"
        },
        take: 5,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });
  return cases;
};
var updateCaseStatus = async (caseId, user, payload) => {
  const existingCase = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      report: true
    }
  });
  if (!existingCase) {
    throw new AppError("Case not found", 404);
  }
  if (existingCase.assignedNgoId !== user.ngoId) {
    throw new AppError("Unauthorized to update this case", 403);
  }
  const updatedCase = await prisma.$transaction(async (tx) => {
    await tx.case.update({
      where: { id: caseId },
      data: {
        status: payload.status
      }
    });
    if (payload.note?.trim()) {
      await tx.caseNote.create({
        data: {
          caseId,
          authorId: user.id,
          note: payload.note.trim()
        }
      });
    }
    await tx.notification.create({
      data: {
        userId: existingCase.report.userId,
        message: payload.note ? `Your case status updated to ${payload.status}. Please check your dashboard for details.` : `Your case status updated to ${payload.status}`
      }
    });
    const fullCase = await tx.case.findUnique({
      where: { id: caseId },
      include: {
        report: {
          include: {
            evidence: {
              orderBy: {
                createdAt: "desc"
              }
            }
          }
        },
        notes: {
          orderBy: {
            createdAt: "desc"
          },
          take: 5,
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });
    if (!fullCase) {
      throw new AppError("Case not found after update", 404);
    }
    return fullCase;
  });
  return updatedCase;
};
var CaseService = {
  getMyCases,
  updateCaseStatus
};

// src/app/modules/case/case.controller.ts
var getMyCases2 = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await CaseService.getMyCases(user, req.query);
  sendResponse(res, {
    success: true,
    message: "Cases fetched successfully",
    data: result
  });
});
var updateCaseStatus2 = catchAsync(async (req, res) => {
  const user = req.user;
  const { id } = req.params;
  const result = await CaseService.updateCaseStatus(
    id,
    user,
    req.body
  );
  sendResponse(res, {
    success: true,
    message: "Case status updated",
    data: result
  });
});
var CaseController = {
  getMyCases: getMyCases2,
  updateCaseStatus: updateCaseStatus2
};

// src/app/modules/case/case.validation.ts
import { z as z4 } from "zod";
var updateCaseSchema = z4.object({
  status: z4.enum([
    "UNDER_REVIEW",
    "IN_PROGRESS",
    "RESOLVED",
    "CLOSED"
  ]),
  note: z4.string().max(500).optional()
});

// src/app/modules/case/case.route.ts
var router4 = express4.Router();
router4.get(
  "/my",
  authenticate,
  requireRole("NGO_ADMIN"),
  CaseController.getMyCases
);
router4.patch(
  "/:id",
  authenticate,
  requireRole("NGO_ADMIN"),
  validateRequest(updateCaseSchema),
  CaseController.updateCaseStatus
);
var CaseRoutes = router4;

// src/app/modules/notification/notificaiton.route.ts
import express5 from "express";

// src/app/modules/notification/notification.controllter.ts
var getMyNotifications2 = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const result = await NotificationService.getMyNotifications(userId);
  sendResponse(res, {
    success: true,
    message: "Notifications fetched",
    data: result
  });
});
var markAsRead2 = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const result = await NotificationService.markAsRead(id, userId);
  sendResponse(res, {
    success: true,
    message: "Notification marked as read",
    data: result
  });
});
var NotificationController = {
  getMyNotifications: getMyNotifications2,
  markAsRead: markAsRead2
};

// src/app/modules/notification/notificaiton.route.ts
var router5 = express5.Router();
router5.get(
  "/",
  authenticate,
  NotificationController.getMyNotifications
);
router5.patch(
  "/:id/read",
  authenticate,
  NotificationController.markAsRead
);
var NotificationRoutes = router5;

// src/app/modules/payment/payment.route.ts
import express6 from "express";

// src/app/config/stripe.ts
import Stripe from "stripe";
var stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// src/app/modules/payment/payment.service.ts
var createOrUpdateDonation = async (transactionId, userId, amount, paymentStatus) => {
  const existing = await prisma.donation.findFirst({
    where: { transactionId }
  });
  if (existing) {
    return prisma.donation.update({
      where: { id: existing.id },
      data: { paymentStatus }
    });
  }
  return prisma.donation.create({
    data: {
      userId,
      amount,
      paymentStatus,
      transactionId
    }
  });
};
var createPaymentIntent = async (userId, amount) => {
  const amountInCents = Math.round(amount * 100);
  if (amountInCents <= 0) {
    throw new AppError("Amount must be greater than 0", 400);
  }
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: "usd",
    automatic_payment_methods: {
      enabled: true
    }
  });
  await prisma.donation.create({
    data: {
      userId,
      amount,
      paymentStatus: "PENDING",
      transactionId: paymentIntent.id
    }
  });
  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id
  };
};
var confirmPayment = async (userId, paymentIntentId) => {
  const donation = await prisma.donation.findFirst({
    where: {
      userId,
      transactionId: paymentIntentId
    }
  });
  if (!donation) {
    throw new AppError("Payment not found for this user", 404);
  }
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (paymentIntent.status !== "succeeded") {
    throw new AppError("Payment not completed yet", 400);
  }
  return prisma.donation.update({
    where: { id: donation.id },
    data: { paymentStatus: "SUCCESS" }
  });
};
var createMonthlySubscription = async (userId, amount) => {
  const amountInCents = Math.round(amount * 100);
  if (amountInCents <= 0) {
    throw new AppError("Amount must be greater than 0", 400);
  }
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });
  if (!user) {
    throw new AppError("User not found", 404);
  }
  const appUrl = process.env.CLIENT_URL || "http://localhost:3000";
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name || void 0,
    metadata: {
      userId
    }
  });
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customer.id,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: amountInCents,
          recurring: {
            interval: "month"
          },
          product_data: {
            name: "Monthly Donation Subscription"
          }
        }
      }
    ],
    metadata: {
      userId,
      type: "MONTHLY_SUBSCRIPTION",
      amount: String(amount)
    },
    subscription_data: {
      metadata: {
        userId,
        type: "MONTHLY_SUBSCRIPTION",
        amount: String(amount)
      }
    },
    success_url: `${appUrl}/donation/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/donation/cancel`
  });
  return {
    checkoutUrl: session.url,
    sessionId: session.id
  };
};
var createOneTimeCheckout = async (userId, amount) => {
  const amountInCents = Math.round(amount * 100);
  if (amountInCents <= 0) {
    throw new AppError("Amount must be greater than 0", 400);
  }
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });
  if (!user) {
    throw new AppError("User not found", 404);
  }
  const appUrl = process.env.CLIENT_URL || "http://localhost:3000";
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: user.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: amountInCents,
          product_data: {
            name: "One-time Donation"
          }
        }
      }
    ],
    metadata: {
      userId,
      type: "ONE_TIME_DONATION",
      amount: String(amount)
    },
    success_url: `${appUrl}/donation/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/donation/cancel`
  });
  await createOrUpdateDonation(session.id, userId, amount, "PENDING");
  return {
    checkoutUrl: session.url,
    sessionId: session.id
  };
};
var getMyDonations = async (userId) => {
  return prisma.donation.findMany({
    where: { userId },
    orderBy: {
      createdAt: "desc"
    }
  });
};
var getDonationDashboard = async () => {
  const donations = await prisma.donation.findMany({
    orderBy: {
      createdAt: "desc"
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });
  const totalAmount = donations.filter((d) => d.paymentStatus === "SUCCESS").reduce((sum, d) => sum + d.amount, 0);
  const totalSuccessfulDonations = donations.filter(
    (d) => d.paymentStatus === "SUCCESS"
  ).length;
  const totalPendingDonations = donations.filter(
    (d) => d.paymentStatus === "PENDING"
  ).length;
  const totalFailedDonations = donations.filter(
    (d) => d.paymentStatus === "FAILED"
  ).length;
  const now = /* @__PURE__ */ new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const thisMonthAmount = donations.filter((d) => {
    const dt = new Date(d.createdAt);
    return d.paymentStatus === "SUCCESS" && dt.getFullYear() === year && dt.getMonth() === month;
  }).reduce((sum, d) => sum + d.amount, 0);
  const monthlyMap = /* @__PURE__ */ new Map();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(year, month - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap.set(key, 0);
  }
  donations.forEach((d) => {
    if (d.paymentStatus !== "SUCCESS") {
      return;
    }
    const dt = new Date(d.createdAt);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyMap.has(key)) {
      monthlyMap.set(key, (monthlyMap.get(key) || 0) + d.amount);
    }
  });
  const monthlyTrend = Array.from(monthlyMap.entries()).map(([period, amount]) => ({
    period,
    amount
  }));
  const monthlySubscriptionPayments = donations.filter(
    (d) => d.paymentStatus === "SUCCESS" && d.transactionId.startsWith("in_")
  ).length;
  const recentTransactions = donations.slice(0, 20).map((donation) => ({
    id: donation.id,
    amount: donation.amount,
    paymentStatus: donation.paymentStatus,
    transactionId: donation.transactionId,
    createdAt: donation.createdAt,
    user: donation.user
  }));
  return {
    summary: {
      totalAmount,
      totalSuccessfulDonations,
      totalPendingDonations,
      totalFailedDonations,
      thisMonthAmount,
      monthlySubscriptionPayments
    },
    monthlyTrend,
    recentTransactions
  };
};
var handleWebhookEvent = async (event) => {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.userId;
    if (!userId) {
      return;
    }
    const amount = (session.amount_total || 0) / 100;
    await createOrUpdateDonation(session.id, userId, amount, "SUCCESS");
  }
  if (event.type === "checkout.session.async_payment_failed") {
    const session = event.data.object;
    const userId = session.metadata?.userId;
    if (!userId) {
      return;
    }
    const amount = (session.amount_total || 0) / 100;
    await createOrUpdateDonation(session.id, userId, amount, "FAILED");
  }
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    await prisma.donation.updateMany({
      where: { transactionId: paymentIntent.id },
      data: { paymentStatus: "SUCCESS" }
    });
  }
  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object;
    await prisma.donation.updateMany({
      where: { transactionId: paymentIntent.id },
      data: { paymentStatus: "FAILED" }
    });
  }
  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object;
    const subscriptionId = invoice.subscription;
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
      "SUCCESS"
    );
  }
  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object;
    const subscriptionId = invoice.subscription;
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
      "FAILED"
    );
  }
};
var PaymentService = {
  createPaymentIntent,
  confirmPayment,
  createMonthlySubscription,
  createOneTimeCheckout,
  getMyDonations,
  getDonationDashboard,
  handleWebhookEvent
};

// src/app/modules/payment/payment.controller.ts
var createPaymentIntent2 = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { amount } = req.body;
  const result = await PaymentService.createPaymentIntent(
    userId,
    amount
  );
  sendResponse(res, {
    success: true,
    message: "Payment intent created",
    data: result
  });
});
var confirmPayment2 = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { paymentIntentId } = req.body;
  const result = await PaymentService.confirmPayment(userId, paymentIntentId);
  sendResponse(res, {
    success: true,
    message: "Payment confirmed",
    data: result
  });
});
var createMonthlySubscription2 = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { amount } = req.body;
  const result = await PaymentService.createMonthlySubscription(userId, amount);
  sendResponse(res, {
    success: true,
    message: "Monthly subscription checkout session created",
    data: result
  });
});
var createOneTimeCheckout2 = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { amount } = req.body;
  const result = await PaymentService.createOneTimeCheckout(userId, amount);
  sendResponse(res, {
    success: true,
    message: "One-time checkout session created",
    data: result
  });
});
var getMyDonations2 = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const result = await PaymentService.getMyDonations(userId);
  sendResponse(res, {
    success: true,
    message: "Donation history fetched",
    data: result
  });
});
var getDonationDashboard2 = catchAsync(async (_req, res) => {
  const result = await PaymentService.getDonationDashboard();
  sendResponse(res, {
    success: true,
    message: "Donation dashboard fetched",
    data: result
  });
});
var handleWebhook = async (req, res) => {
  const signature = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || typeof signature !== "string") {
    return res.status(400).json({ message: "Missing stripe-signature header" });
  }
  if (!webhookSecret) {
    return res.status(500).json({ message: "Missing STRIPE_WEBHOOK_SECRET" });
  }
  try {
    const event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    await PaymentService.handleWebhookEvent(event);
    return res.status(200).json({ received: true });
  } catch (error) {
    return res.status(400).json({ message: `Webhook Error: ${error.message}` });
  }
};
var PaymentController = {
  createPaymentIntent: createPaymentIntent2,
  confirmPayment: confirmPayment2,
  createMonthlySubscription: createMonthlySubscription2,
  createOneTimeCheckout: createOneTimeCheckout2,
  getMyDonations: getMyDonations2,
  getDonationDashboard: getDonationDashboard2,
  handleWebhook
};

// src/app/modules/payment/payment.validation.ts
import { z as z5 } from "zod";
var createPaymentIntentSchema = z5.object({
  amount: z5.number().positive("Amount must be greater than 0")
});
var confirmPaymentSchema = z5.object({
  paymentIntentId: z5.string().min(1, "paymentIntentId is required")
});
var createMonthlySubscriptionSchema = z5.object({
  amount: z5.number().positive("Amount must be greater than 0")
});
var createOneTimeCheckoutSchema = z5.object({
  amount: z5.number().positive("Amount must be greater than 0")
});

// src/app/modules/payment/payment.route.ts
var router6 = express6.Router();
router6.post(
  "/create-payment-intent",
  authenticate,
  validateRequest(createPaymentIntentSchema),
  PaymentController.createPaymentIntent
);
router6.post(
  "/confirm",
  authenticate,
  validateRequest(confirmPaymentSchema),
  PaymentController.confirmPayment
);
router6.post(
  "/monthly-subscription",
  authenticate,
  validateRequest(createMonthlySubscriptionSchema),
  PaymentController.createMonthlySubscription
);
router6.post(
  "/one-time-checkout",
  authenticate,
  validateRequest(createOneTimeCheckoutSchema),
  PaymentController.createOneTimeCheckout
);
router6.get(
  "/my-history",
  authenticate,
  PaymentController.getMyDonations
);
router6.get(
  "/dashboard",
  authenticate,
  requireRole("SUPER_ADMIN"),
  PaymentController.getDonationDashboard
);
var PaymentRoutes = router6;

// src/app/modules/oauth/oauth.route.ts
import { Router } from "express";
var router7 = Router();
router7.get("/:provider", async (req, res) => {
  try {
    const { provider } = req.params;
    if (provider !== "google") {
      return res.status(400).json({ error: "Unsupported provider" });
    }
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ error: "Google Client ID not configured" });
    }
    const redirectUri = `${process.env.BETTER_AUTH_URL || "http://localhost:5000"}/api/oauth/callback/google`;
    const scope = "openid profile email";
    const state = Math.random().toString(36).substring(7);
    req.session = req.session || {};
    req.session.oauthState = state;
    const oauthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    oauthUrl.searchParams.append("client_id", clientId);
    oauthUrl.searchParams.append("redirect_uri", redirectUri);
    oauthUrl.searchParams.append("response_type", "code");
    oauthUrl.searchParams.append("scope", scope);
    oauthUrl.searchParams.append("state", state);
    oauthUrl.searchParams.append("access_type", "offline");
    oauthUrl.searchParams.append("prompt", "consent");
    console.log("Generated OAuth URL:", oauthUrl.toString());
    console.log("Redirect URI:", redirectUri);
    console.log("Client ID:", clientId.substring(0, 20) + "...");
    res.json({ url: oauthUrl.toString() });
  } catch (error) {
    console.error("OAuth URL generation error:", error);
    res.status(500).json({ error: "Failed to generate OAuth URL" });
  }
});
var oauth_route_default = router7;

// src/app/modules/oauth/oauth.callback.ts
import { Router as Router2 } from "express";
var router8 = Router2();
var processedCodes = /* @__PURE__ */ new Map();
async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`\u{1F534} API Response: ${response.status} ${response.statusText}`);
    console.error(`\u{1F4C4} Response body:`, errorText);
    throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
  }
  return response.json();
}
router8.get("/google", async (req, res) => {
  try {
    const { code, error } = req.query;
    if (error) {
      console.error("OAuth error from Google:", error);
      const frontendUrl2 = process.env.FRONTEND_URL || "http://localhost:3000";
      return res.redirect(`${frontendUrl2}/login?error=${encodeURIComponent(String(error))}`);
    }
    if (!code || typeof code !== "string") {
      console.error("No authorization code provided");
      return res.status(400).json({ error: "No authorization code provided" });
    }
    const cachedAuth = processedCodes.get(code);
    if (cachedAuth && Date.now() - cachedAuth.timestamp < 10 * 60 * 1e3) {
      console.log("\u267B\uFE0F Code already processed, reusing session token:", code.substring(0, 20) + "...");
      const frontendUrl2 = process.env.FRONTEND_URL || "http://localhost:3000";
      const maxAgeMs2 = 7 * 24 * 60 * 60 * 1e3;
      res.cookie("auth-token", cachedAuth.sessionToken, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: maxAgeMs2
      });
      return res.redirect(`${frontendUrl2}/dashboard?oauth_success=true`);
    }
    console.log("\u{1F535} Processing OAuth callback for Google with code:", code.substring(0, 20) + "...");
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      throw new Error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variables");
    }
    const redirectUri = `${process.env.BETTER_AUTH_URL || "http://localhost:5000"}/api/oauth/callback/google`;
    console.log("\u{1F4CD} Redirect URI:", redirectUri);
    console.log("\u{1F504} Exchanging code for tokens...");
    let tokenData;
    try {
      tokenData = await fetchJson("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          code,
          grant_type: "authorization_code",
          redirect_uri: redirectUri
        })
      });
    } catch (tokenError) {
      const errorMsg = String(tokenError.message);
      if (errorMsg.includes("invalid_grant") || errorMsg.includes("400")) {
        console.warn("\u26A0\uFE0F Authorization code was already used or is invalid");
        console.warn("This can happen if the callback is triggered multiple times");
        const recentSession = await prisma.session.findFirst({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 5 * 60 * 1e3)
            }
          },
          orderBy: { createdAt: "desc" }
        });
        if (recentSession) {
          console.log("\u2705 Found recent session for this auth attempt, reusing...");
          const frontendUrl2 = process.env.FRONTEND_URL || "http://localhost:3000";
          const maxAgeMs2 = 7 * 24 * 60 * 60 * 1e3;
          res.cookie("auth-token", recentSession.token, {
            httpOnly: true,
            sameSite: "lax",
            maxAge: maxAgeMs2
          });
          return res.redirect(`${frontendUrl2}/dashboard?oauth_success=true`);
        }
        throw tokenError;
      }
      throw tokenError;
    }
    const { access_token } = tokenData;
    console.log("\u2705 Token exchange successful");
    console.log("\u{1F4E7} Fetching user info from Google...");
    const userInfo = await fetchJson(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      }
    );
    const { id, name, email, picture } = userInfo;
    console.log("\u2705 User info retrieved:", email);
    if (!email) {
      throw new Error("No email provided by Google");
    }
    console.log("\u{1F50D} Looking up user in database:", email);
    let user = await prisma.user.findUnique({
      where: { email }
    });
    if (!user) {
      console.log("\u{1F464} Creating new user...");
      user = await prisma.user.create({
        data: {
          email,
          name: name || email,
          image: picture,
          emailVerified: true
        }
      });
      console.log("\u2705 New user created:", email, "ID:", user.id);
    } else {
      console.log("\u{1F504} Updating existing user...");
      if (name || picture) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            ...name && { name },
            ...picture && { image: picture },
            emailVerified: true
          }
        });
      }
      console.log("\u2705 User updated:", email);
    }
    console.log("\u{1F510} Creating session for user:", user.id);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3);
    const sessionToken = `session_${Math.random().toString(36).substring(2, 15)}_${Math.random().toString(36).substring(2, 15)}`;
    const session = await prisma.session.create({
      data: {
        expiresAt,
        userId: user.id,
        token: sessionToken,
        ipAddress: req.ip || req.socket?.remoteAddress || "unknown",
        userAgent: req.get("user-agent") || "unknown"
      }
    });
    console.log("\u2705 Session created:", session.id, "expires at:", expiresAt);
    processedCodes.set(code, { timestamp: Date.now(), sessionToken });
    for (const [key, value] of processedCodes.entries()) {
      if (Date.now() - value.timestamp > 10 * 60 * 1e3) {
        processedCodes.delete(key);
      }
    }
    console.log("\u{1F36A} Setting session cookie...");
    const maxAgeMs = 7 * 24 * 60 * 60 * 1e3;
    res.cookie("auth-token", sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: maxAgeMs
    });
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    console.log("\u{1F3AF} Redirecting to:", `${frontendUrl}/dashboard?oauth_success=true`);
    return res.redirect(`${frontendUrl}/dashboard?oauth_success=true`);
  } catch (error) {
    console.error("\u274C OAuth callback error:", error);
    const errorMessage = error?.message || String(error) || "Unknown error";
    const errorStack = error?.stack || "";
    console.error("Error message:", errorMessage);
    console.error("Error stack:", errorStack);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const encodedMessage = encodeURIComponent(errorMessage);
    return res.redirect(`${frontendUrl}/login?error=oauth_failed&details=${encodedMessage}`);
  }
});
var oauth_callback_default = router8;

// src/app/modules/oauth/oauth.session.ts
import { Router as Router3 } from "express";
var router9 = Router3();
router9.get("/session", async (req, res) => {
  try {
    const cookies = req.headers.cookie || "";
    const authTokenMatch = cookies.match(/auth-token=([^;]+)/);
    const sessionTokenMatch = cookies.match(/better-auth\.session_token=([^;]+)/);
    const token = authTokenMatch?.[1] || sessionTokenMatch?.[1];
    if (!token) {
      return res.status(401).json({ error: "No session token found" });
    }
    console.log("Looking up session with token:", token.substring(0, 20) + "...");
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true }
    });
    if (!session) {
      console.log("Session not found");
      return res.status(401).json({ error: "Session not found" });
    }
    if (session.expiresAt < /* @__PURE__ */ new Date()) {
      console.log("Session expired");
      await prisma.session.delete({ where: { id: session.id } });
      return res.status(401).json({ error: "Session expired" });
    }
    console.log("Session found for user:", session.user.email);
    return res.status(200).json({
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
        role: session.user.role,
        emailVerified: session.user.emailVerified
      },
      session: {
        id: session.id,
        expiresAt: session.expiresAt
      }
    });
  } catch (error) {
    console.error("Session endpoint error:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
});
var oauth_session_default = router9;

// src/app.ts
var app = express7();
var authHandler = toNodeHandler(auth);
var vercelFrontendOriginPattern = /^https:\/\/nirapod-kontho-frontend(?:-[a-z0-9-]+)?\.vercel\.app$/;
var allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
  "https://nirapod-kontho-frontend.vercel.app",
  "http://localhost:3000"
].filter((origin) => Boolean(origin));
var isAllowedOrigin = (origin) => {
  if (!origin) {
    return true;
  }
  if (allowedOrigins.includes(origin)) {
    return true;
  }
  const allowPreviewOrigins = process.env.ALLOW_VERCEL_PREVIEW_ORIGINS === "true";
  if (allowPreviewOrigins && vercelFrontendOriginPattern.test(origin)) {
    return true;
  }
  return false;
};
app.post(
  "/api/payments/webhook",
  express7.raw({ type: "application/json" }),
  PaymentController.handleWebhook
);
app.use(express7.json());
app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);
app.options("*", cors());
app.use(helmet());
app.use(morgan("dev"));
app.all("/api/auth/signup", (req, res) => {
  req.url = "/api/auth/sign-up/email";
  return authHandler(req, res);
});
app.all("/api/auth/signin", (req, res) => {
  req.url = "/api/auth/sign-in/email";
  return authHandler(req, res);
});
app.get("/api/auth/session", async (req, res) => {
  try {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    res.set("Surrogate-Control", "no-store");
    const headersObject = {};
    if (req.headers.cookie) {
      headersObject["cookie"] = req.headers.cookie;
    }
    if (req.headers.authorization) {
      headersObject["authorization"] = req.headers.authorization;
    }
    const sessionResponse = await auth.api.getSession({
      headers: headersObject
    });
    if (!sessionResponse || !sessionResponse.user) {
      return res.status(401).json({ error: "No active session" });
    }
    const session = sessionResponse.session || sessionResponse;
    const user = sessionResponse.user;
    if (session?.expiresAt && new Date(session.expiresAt) < /* @__PURE__ */ new Date()) {
      console.log(`[Session] Session expired for user ${user.id}`);
      return res.status(401).json({ error: "Session expired" });
    }
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        emailVerified: true
      }
    });
    if (!fullUser) {
      return res.status(401).json({ error: "User not found" });
    }
    console.log(`[Session] Valid session for user: ${fullUser.email} (${fullUser.role})`);
    return res.status(200).json({
      data: {
        user: fullUser,
        session: {
          id: session?.id || "",
          expiresAt: session?.expiresAt
        }
      },
      user: fullUser
    });
  } catch (error) {
    console.error("[Session] Error:", error.message);
    return res.status(401).json({ error: "Failed to retrieve session" });
  }
});
var limiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  max: 100
});
app.use(limiter);
app.use("/api/reports", ReportRoutes);
app.use("/api/verification", VerificationRoutes);
app.use("/api/ngos", NgoRoutes);
app.use("/api/cases", CaseRoutes);
app.use("/api/notifications", NotificationRoutes);
app.use("/api/payments", PaymentRoutes);
app.use("/api/oauth/callback", oauth_callback_default);
app.use("/api/oauth", oauth_session_default);
app.use("/api/oauth", oauth_route_default);
app.all("/api/auth", authHandler);
app.all("/api/auth/*splat", authHandler);
app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: "ok",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    res.status(503).json({
      status: "error",
      message: "Database connection failed",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
});
app.get("/", (req, res) => {
  res.send("Nirapod Kontho API is Running...");
});
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.path
  });
});
app.use(globalErrorHandler);
var app_default = app;

// src/server.ts
dotenv.config({ quiet: true });
var PORT = process.env.PORT || 5e3;
var gracefulShutdown = async () => {
  console.log("Gracefully shutting down...");
  try {
    await prisma.$disconnect();
    console.log("Prisma disconnected");
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:", error);
    process.exit(1);
  }
};
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
var isVercelRuntime = Boolean(process.env.VERCEL);
if (!isVercelRuntime) {
  app_default.listen(PORT, () => {
    console.log(`\u2713 Server running on port ${PORT}`);
    console.log(`\u2713 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`\u2713 Better Auth URL: ${process.env.BETTER_AUTH_URL}`);
  });
}
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});
var server_default = app_default;
export {
  server_default as default
};
