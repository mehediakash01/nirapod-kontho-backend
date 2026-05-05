import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { prisma } from '../../config/prisma';

const getDashboardAnalytics = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { role, id, ngoId } = user;

  let analyticsData: any = {
    overview: {},
    charts: {}
  };

  try {
    if (role === 'USER') {
      const totalReports = await prisma.report.count({ where: { userId: id } });
      const verifiedReports = await prisma.report.count({ where: { userId: id, status: 'VERIFIED' } });
      const pendingReports = await prisma.report.count({ where: { userId: id, status: 'SUBMITTED' } });

      const donationsAmount = await prisma.donation.aggregate({
        where: { userId: id, paymentStatus: 'SUCCESS' },
        _sum: { amount: true }
      });

      analyticsData.overview = {
        totalReports,
        verifiedReports,
        pendingReports,
        totalDonated: donationsAmount._sum.amount || 0,
      };

      const monthlyReports = await prisma.$queryRaw`
        SELECT DATE_TRUNC('month', "createdAt") as month, COUNT(*)::int as count 
        FROM "Report" WHERE "userId" = ${id} GROUP BY month ORDER BY month ASC LIMIT 6
      `;

      analyticsData.charts = {
        reportsByMonth: Array.isArray(monthlyReports) 
          ? monthlyReports.map((r: any) => ({ name: new Date(r.month).toLocaleString('default', { month: 'short' }), value: r.count }))
          : []
      };

    } else if (role === 'SUPER_ADMIN') {
      const totalUsers = await prisma.user.count();
      const totalReports = await prisma.report.count();
      const totalNGOs = await prisma.nGO.count();
      
      const successDonations = await prisma.donation.aggregate({
        where: { paymentStatus: 'SUCCESS' },
        _sum: { amount: true }
      });

      analyticsData.overview = {
        totalUsers,
        totalReports,
        totalNGOs,
        totalDonations: successDonations._sum.amount || 0,
      };

      const reportsByType = await prisma.report.groupBy({
        by: ['type'],
        _count: true
      });

      const monthlyUsers = await prisma.$queryRaw`
        SELECT DATE_TRUNC('month', "createdAt") as month, COUNT(*)::int as count 
        FROM "User" GROUP BY month ORDER BY month ASC LIMIT 6
      `;

      analyticsData.charts = {
        reportsByType: reportsByType.map(r => ({ name: r.type, value: r._count })),
        usersByMonth: Array.isArray(monthlyUsers)
          ? monthlyUsers.map((r: any) => ({ name: new Date(r.month).toLocaleString('default', { month: 'short' }), value: r.count }))
          : []
      };

    } else if (role === 'NGO_ADMIN' && ngoId) {
      const activeCases = await prisma.case.count({ where: { assignedNgoId: ngoId, status: { in: ['IN_PROGRESS', 'UNDER_REVIEW'] } } });
      const resolvedCases = await prisma.case.count({ where: { assignedNgoId: ngoId, status: 'RESOLVED' } });
      
      analyticsData.overview = {
        activeCases,
        resolvedCases,
      };

      const caseStatusDist = await prisma.case.groupBy({
        by: ['status'],
        where: { assignedNgoId: ngoId },
        _count: true
      });

      analyticsData.charts = {
        casesByStatus: caseStatusDist.map(c => ({ name: c.status, value: c._count }))
      };

    } else if (role === 'MODERATOR') {
      const pendingCount = await prisma.report.count({ where: { status: 'SUBMITTED' } });
      const verifiedCount = await prisma.report.count({ where: { status: 'VERIFIED' } });

      analyticsData.overview = {
        pendingForReview: pendingCount,
        verifiedByModerators: verifiedCount
      };

      const monthlyVerified = await prisma.$queryRaw`
        SELECT DATE_TRUNC('month', "createdAt") as month, COUNT(*)::int as count 
        FROM "ReportVerification" GROUP BY month ORDER BY month ASC LIMIT 6
      `;

      analyticsData.charts = {
        verificationsByMonth: Array.isArray(monthlyVerified)
          ? monthlyVerified.map((r: any) => ({ name: new Date(r.month).toLocaleString('default', { month: 'short' }), value: r.count }))
          : []
      };
    }
    
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Analytics retrieved successfully',
      data: analyticsData,
    });
  } catch (error: any) {
    console.error('[Analytics] Error fetching dashboard analytics:', error?.message || error);
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: 'Failed to retrieve analytics',
      data: null,
    });
  }
});

export const AnalyticsControllers = {
  getDashboardAnalytics
};
