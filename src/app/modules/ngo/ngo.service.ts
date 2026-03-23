import { prisma } from "../../config/prisma";
import { AppError } from "../../errors/AppError";


const createNgo = async (payload: any) => {
  // check if email exists
  const existing = await prisma.nGO.findUnique({
    where: { email: payload.email },
  });

  if (existing) {
    throw new AppError('NGO already exists with this email', 400);
  }

  const ngo = await prisma.nGO.create({
    data: payload,
  });

  return ngo;
};

const getAllNgo = async () => {
  return prisma.nGO.findMany({
    include: {
      cases: true,
    },
  });
};

const getSingleNgo = async (id: string) => {
  const ngo = await prisma.nGO.findUnique({
    where: { id },
    include: {
      cases: true,
    },
  });

  if (!ngo) {
    throw new AppError('NGO not found', 404);
  }

  return ngo;
};

export const NgoService = {
  createNgo,
  getAllNgo,
  getSingleNgo,
};