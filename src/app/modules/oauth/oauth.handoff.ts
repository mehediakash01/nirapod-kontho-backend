import { randomUUID } from 'crypto';
import { prisma } from '../../config/prisma';

const OAUTH_HANDOFF_PREFIX = 'oauth-handoff:';
const OAUTH_HANDOFF_TTL_MS = 2 * 60 * 1000;

const buildIdentifier = (handoffCode: string) => `${OAUTH_HANDOFF_PREFIX}${handoffCode}`;

export const createOauthHandoff = async (sessionToken: string) => {
  const handoffCode = randomUUID();

  await prisma.verification.create({
    data: {
      identifier: buildIdentifier(handoffCode),
      value: JSON.stringify({ sessionToken }),
      expiresAt: new Date(Date.now() + OAUTH_HANDOFF_TTL_MS),
    },
  });

  return handoffCode;
};

export const consumeOauthHandoff = async (handoffCode: string) => {
  const identifier = buildIdentifier(handoffCode);
  const handoff = await prisma.verification.findFirst({
    where: { identifier },
  });

  if (!handoff) {
    return null;
  }

  await prisma.verification.deleteMany({
    where: { identifier },
  });

  if (handoff.expiresAt < new Date()) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(handoff.value) as { sessionToken?: string };
    return parsedValue.sessionToken || null;
  } catch {
    return handoff.value || null;
  }
};
