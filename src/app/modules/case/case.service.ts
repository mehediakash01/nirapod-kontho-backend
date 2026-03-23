import { prisma } from "../../config/prisma";
import { AppError } from "../../errors/AppError";
import { IUpdateCaseStatus } from "./case.interface";


const getMyCases = async (user: any) => {
  // NGO admin → get their NGO id
  if (!user.ngoId) {
    throw new AppError('User not linked to NGO', 400);
  }

  const cases = await prisma.case.findMany({
    where: {
      assignedNgoId: user.ngoId,
    },
    include: {
      report: true,
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
  });

  if (!existingCase) {
    throw new AppError('Case not found', 404);
  }

  //  ensure NGO owns this case
  if (existingCase.assignedNgoId !== user.ngoId) {
    throw new AppError('Unauthorized to update this case', 403);
  }

  const updated = await prisma.case.update({
    where: { id: caseId },
    data: {
      status: payload.status,
    },
  });

  return updated;
};

export const CaseService = {
  getMyCases,
  updateCaseStatus,
};