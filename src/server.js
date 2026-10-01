import app from './app.js';
import env from './config/env.js';
import logger from './config/logger.js';
import { connectDB, disconnectDB } from './config/db.js';

let server;

const start = async () => {
  await connectDB();
  server = app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT} (${env.NODE_ENV})`);
    logger.info(`Swagger docs: http://localhost:${env.PORT}/api-docs`);
  });
};

const shutdown = async (signal) => {
  logger.info(`${signal} received, shutting down`);
  const force = setTimeout(() => process.exit(1), 10000);
  force.unref();
  if (server) await new Promise((r) => server.close(r));
  await disconnectDB();
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (err) => { logger.fatal({ err }, 'Unhandled rejection'); shutdown('unhandledRejection'); });
process.on('uncaughtException', (err) => { logger.fatal({ err }, 'Uncaught exception'); process.exit(1); });

start().catch((err) => { logger.fatal({ err }, 'Failed to start'); process.exit(1); });
