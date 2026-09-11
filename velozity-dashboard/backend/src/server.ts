import http from 'http';
import app from './app';
import { config } from './config/config';
import { initializeSocket } from './socket/socket.manager';
import { startOverdueJob } from './jobs/overdue.job';
import { prisma } from './config/prisma';

const httpServer = http.createServer(app);

// Initialize Socket.io on the same HTTP server
initializeSocket(httpServer);

// Start background jobs
startOverdueJob();

// Graceful shutdown
async function shutdown(signal: string) {
  console.log(`\n[Server] ${signal} received. Shutting down gracefully...`);
  httpServer.close(async () => {
    await prisma.$disconnect();
    console.log('[Server] HTTP server closed. DB connection closed.');
    process.exit(0);
  });
  // Force close after 10s
  setTimeout(() => process.exit(1), 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught exception:', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Server] Unhandled rejection:', reason);
  process.exit(1);
});

httpServer.listen(config.port, () => {
  console.log(`\n🚀 Velozity API running on http://localhost:${config.port}`);
  console.log(`   Environment: ${config.nodeEnv}`);
  console.log(`   CORS origin: ${config.corsOrigin}`);
  console.log(`   Socket.io: enabled`);
  console.log(`   Overdue job: running (every minute)\n`);
});
