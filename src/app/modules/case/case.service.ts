import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../errors/AppError";
import { buildQueryOptions } from "../../utils/queryBuilder";
import { IUpdateCaseStatus } from "./case.interface";


const getMyCases = async (user: any, query: any) => {
  const { skip, limit } = buildQueryOptions(query);

  const where: any = {
    assignedNgoId: user.ngoId,
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
              createdAt: 'desc',
            },
          },
        },
      },
      notes: {
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return cases;
};

const updateCaseStatus = async (
  caseId: string,
  user: any,
  payload: IUpdateCaseStatus
) => {
  const existingCase = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      report: true,
    },
  });

  if (!existingCase) {
    throw new AppError('Case not found', 404);
  }
  

  //  ensure NGO owns this case
  if (existingCase.assignedNgoId !== user.ngoId) {
    throw new AppError('Unauthorized to update this case', 403);
  }

  const updatedCase = await prisma.$transaction(async (tx:Prisma.TransactionClient) => {
    await tx.case.update({
      where: { id: caseId },
      data: {
        status: payload.status,
      },
    });

    if (payload.note?.trim()) {
      await tx.caseNote.create({
        data: {
          caseId,
          authorId: user.id,
          note: payload.note.trim(),
        },
      });
    }

    await tx.notification.create({
      data: {
        userId: existingCase.report.userId,
        message: payload.note
          ? `Your case status updated to ${payload.status}. Please check your dashboard for details.`
          : `Your case status updated to ${payload.status}`,
      },
    });

    const fullCase = await tx.case.findUnique({
      where: { id: caseId },
      include: {
        report: {
          include: {
            evidence: {
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
        },
        notes: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!fullCase) {
      throw new AppError('Case not found after update', 404);
    }

    return fullCase;
  });

  return updatedCase;
};



export const CaseService = {
  getMyCases,
  updateCaseStatus,
};