import 'dotenv/config';

import app from './app';
import { prisma } from './app/config/prisma';

const PORT = process.env.PORT || 5000;

// Graceful shutdown handler
const gracefulShutdown = async () => {
  console.log('Gracefully shutting down...');
  try {
    await prisma.$disconnect();
    console.log('Prisma disconnected');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

const isVercelRuntime = Boolean(process.env.VERCEL);

if (!isVercelRuntime) {
  // Local/dev runtime should start an HTTP listener.
  app.listen(PORT, () => {
    console.log(`✓ Server running on port ${PORT}`);
    console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`✓ Better Auth URL: ${process.env.BETTER_AUTH_URL}`);
  });
}

// Handle unhandled errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  if (!isVercelRuntime) {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  if (!isVercelRuntime) {
    process.exit(1);
  }
});

export default app;