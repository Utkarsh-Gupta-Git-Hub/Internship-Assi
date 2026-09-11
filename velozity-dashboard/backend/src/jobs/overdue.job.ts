import cron from 'node-cron';
import { TaskStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { emitOverdueUpdate } from '../socket/socket.manager';

/**
 * Overdue Task Background Job
 *
 * Why node-cron instead of Bull queue?
 * - This is a single, simple scheduled task (run every minute, mark overdue tasks)
 * - Bull requires Redis as a dependency — adds infrastructure complexity for no benefit here
 * - node-cron is lightweight, in-process, and sufficient for this use case
 * - If this scaled to distributed workers or needed job retries/backpressure, Bull would be appropriate
 *
 * Schedule: Every minute
 * Action: Find tasks where dueDate is before now AND status is not DONE AND isOverdue is false.
 *         Update them to isOverdue = true, log activity, emit Socket.io event.
 */
export function startOverdueJob(): void {
  console.log('[Cron] Starting overdue task job — runs every minute');

  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();

      // Find newly overdue tasks (not already flagged, not done)
      const overdueTaskIds = await prisma.task.findMany({
        where: {
          dueDate: { lt: now },
          isOverdue: false,
          status: { notIn: [TaskStatus.DONE] },
        },
        select: { id: true, title: true, projectId: true, assignedTo: true },
      });

      if (overdueTaskIds.length === 0) return;

      console.log(`[Cron] Flagging ${overdueTaskIds.length} task(s) as overdue`);

      // Bulk update
      await prisma.task.updateMany({
        where: {
          id: { in: overdueTaskIds.map((t) => t.id) },
        },
        data: { isOverdue: true },
      });

      // Log activity for each overdue task and emit socket event
      for (const task of overdueTaskIds) {
        // Activity log entry — stored in DB, not derived
        await prisma.activityLog.create({
          data: {
            taskId: task.id,
            projectId: task.projectId,
            userId: 'system', // sentinel value for system-generated events
            action: 'overdue',
            toStatus: TaskStatus.OVERDUE,
            metadata: { taskTitle: task.title, userName: 'System' },
          },
        });

        // Notify assigned developer
        if (task.assignedTo) {
          await prisma.notification.create({
            data: {
              userId: task.assignedTo,
              title: 'Task overdue',
              message: `"${task.title}" is now overdue. Please update the status or request an extension.`,
              taskId: task.id,
            },
          });
        }

        // Emit real-time update
        emitOverdueUpdate(task.projectId, task.id);
      }
    } catch (err) {
      console.error('[Cron] Overdue job error:', err);
      // Do not crash the process — log and continue
    }
  });
}
