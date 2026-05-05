import { prisma } from '../../config/prisma';

const updateProfile = async (userId: string, payload: { name?: string; image?: string }) => {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(payload.name && { name: payload.name }),
      ...(payload.image && { image: payload.image }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      ngoId: true,
      createdAt: true,
    }
  });

  return updatedUser;
};

export const UserServices = {
  updateProfile,
};