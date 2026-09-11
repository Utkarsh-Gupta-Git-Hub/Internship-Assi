import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { Role } from '@prisma/client';
import { verifyAccessToken } from '../utils/jwt';
import { prisma } from '../config/prisma';
import { config } from '../config/config';

export interface ActivityEvent {
  id: string;
  taskId: string;
  projectId: string;
  taskTitle: string;
  userName: string;
  userId: string;
  action: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  assignedTo?: string | null;
  createdAt: Date;
}

// Singleton Socket.io server instance — exported for use in controllers
let io: SocketServer;

/**
 * Initialize Socket.io server attached to the HTTP server.
 *
 * Design decisions:
 * - Socket.io chosen over native WebSocket for:
 *   1. Built-in room abstraction (perfect for per-project real-time feeds)
 *   2. Automatic reconnection with exponential backoff
 *   3. JWT auth via handshake middleware
 *   4. Namespace + room support simplifies RBAC filtering
 *
 * Room structure:
 *   project:<projectId>  — all users viewing that project
 *   user:<userId>        — personal room for notifications
 *   global               — admin-only global feed
 */
export function initializeSocket(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: config.corsOrigin,
      credentials: true,
    },
    // ping every 10s, disconnect if no pong in 5s
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  // ─── Auth Middleware ───────────────────────────────────────────────────────
  // Validates JWT from handshake.auth.token — same token as HTTP requests.
  // If invalid, socket connection is rejected before any event can fire.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const payload = verifyAccessToken(token);
      (socket as Socket & { user: ReturnType<typeof verifyAccessToken> }).user = payload;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  // ─── Connection Handler ────────────────────────────────────────────────────
  io.on('connection', async (socket) => {
    const user = (socket as Socket & { user: ReturnType<typeof verifyAccessToken> }).user;
    console.log(`[Socket] Connected: ${user.name} (${user.role}) — ${socket.id}`);

    // Always join personal room for notifications
    socket.join(`user:${user.userId}`);

    // Admin joins the global feed room
    if (user.role === Role.ADMIN) {
      socket.join('global');
    }

    // Join project rooms based on role
    await joinProjectRooms(socket, user);

    // Update online status in DB
    await prisma.user.update({
      where: { id: user.userId },
      data: { isOnline: true, lastSeen: new Date() },
    });

    // Broadcast online count to admins
    broadcastOnlineCount();

    // ─── Client events ──────────────────────────────────────────────────────

    // Client requests to join a specific project room (e.g., navigating to project page)
    socket.on('join:project', async (projectId: string) => {
      const hasAccess = await checkProjectAccess(projectId, user);
      if (hasAccess) {
        socket.join(`project:${projectId}`);
        console.log(`[Socket] ${user.name} joined room: project:${projectId}`);
      }
    });

    socket.on('leave:project', (projectId: string) => {
      socket.leave(`project:${projectId}`);
    });

    // Reconnect catchup — fetch missed events from DB (not from memory)
    socket.on('missed:events', async ({ since }: { since: string }) => {
      const missedEvents = await fetchMissedEvents(user, since);
      socket.emit('missed:events:response', missedEvents);
    });

    // ─── Disconnect ─────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`[Socket] Disconnected: ${user.name} — ${socket.id}`);

      // Check if user has any other active connections
      const sockets = await io.fetchSockets();
      const stillOnline = sockets.some((s) => {
        const su = (s as unknown as { user: { userId: string } }).user;
        return su?.userId === user.userId;
      });

      if (!stillOnline) {
        await prisma.user.update({
          where: { id: user.userId },
          data: { isOnline: false, lastSeen: new Date() },
        });
        broadcastOnlineCount();
      }
    });
  });

  console.log('[Socket.io] Initialized');
  return io;
}

// ─── Helper: Join project rooms by role ───────────────────────────────────────
async function joinProjectRooms(
  socket: Socket,
  user: { userId: string; role: string }
) {
  let projectIds: string[] = [];

  if (user.role === Role.ADMIN) {
    const projects = await prisma.project.findMany({ select: { id: true } });
    projectIds = projects.map((p) => p.id);
  } else if (user.role === Role.PROJECT_MANAGER) {
    const projects = await prisma.project.findMany({
      where: { createdBy: user.userId },
      select: { id: true },
    });
    projectIds = projects.map((p) => p.id);
  } else if (user.role === Role.DEVELOPER) {
    const memberships = await prisma.projectMember.findMany({
      where: { userId: user.userId },
      select: { projectId: true },
    });
    projectIds = memberships.map((m) => m.projectId);
  }

  for (const projectId of projectIds) {
    socket.join(`project:${projectId}`);
  }
}

// ─── Helper: Check project access for dynamic room join ───────────────────────
async function checkProjectAccess(
  projectId: string,
  user: { userId: string; role: string }
): Promise<boolean> {
  if (user.role === Role.ADMIN) return true;

  if (user.role === Role.PROJECT_MANAGER) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, createdBy: user.userId },
    });
    return !!project;
  }

  // Developer
  const membership = await prisma.projectMember.findFirst({
    where: { projectId, userId: user.userId },
  });
  return !!membership;
}

// ─── Helper: Fetch missed events from DB (not memory) ─────────────────────────
async function fetchMissedEvents(
  user: { userId: string; role: string },
  since: string
) {
  const sinceDate = new Date(since);
  let where: Record<string, unknown> = { createdAt: { gte: sinceDate } };

  if (user.role === Role.PROJECT_MANAGER) {
    where = { ...where, project: { createdBy: user.userId } };
  } else if (user.role === Role.DEVELOPER) {
    where = { ...where, task: { assignedTo: user.userId } };
  }

  return prisma.activityLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 20, // Spec: last 20 missed events
    include: {
      user: { select: { id: true, name: true } },
      task: { select: { id: true, title: true } },
      project: { select: { id: true, name: true } },
    },
  });
}

// ─── Helper: Broadcast online user count to admins ────────────────────────────
async function broadcastOnlineCount() {
  const count = await prisma.user.count({ where: { isOnline: true } });
  io.to('global').emit('presence:count', { count });
}

// ─── Exported emitters (called from controllers) ──────────────────────────────

/**
 * Emit a task activity event to all users in the project room.
 * Filtering logic:
 *   - Admin: in 'global' room, receives all
 *   - PM: in `project:<id>` rooms for their projects only
 *   - Developer: in their project rooms but only receives events on their tasks
 *     (enforced by the client filtering on assignedTo field)
 */
export function emitActivityEvent(projectId: string, event: ActivityEvent): void {
  if (!io) return;
  // Emit to the project room — all users who joined this room will receive it
  io.to(`project:${projectId}`).emit('activity:new', event);
  // Also emit to global room (admin)
  io.to('global').emit('activity:new', event);
}

/**
 * Emit a notification to a specific user's personal room.
 */
export function emitNotification(userId: string, notification: unknown): void {
  if (!io) return;
  io.to(`user:${userId}`).emit('notification:new', notification);
}

/**
 * Emit overdue task event (from the cron job).
 */
export function emitOverdueUpdate(projectId: string, taskId: string): void {
  if (!io) return;
  io.to(`project:${projectId}`).emit('task:overdue', { taskId, projectId });
}

export { io };
