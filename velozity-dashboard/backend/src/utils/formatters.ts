import { format, formatDistanceToNow } from 'date-fns';

/**
 * Format an activity log entry into a human-readable string.
 * e.g. "Ravi moved Task #12 from In Progress → In Review · 2 mins ago"
 */
export function formatActivityMessage(params: {
  userName: string;
  action: string;
  taskTitle: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  createdAt: Date;
}): string {
  const { userName, action, taskTitle, fromStatus, toStatus, createdAt } = params;

  const statusLabel = (s: string) =>
    s
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());

  let message = `${userName} ${action} "${taskTitle}"`;

  if (fromStatus && toStatus) {
    message += ` from ${statusLabel(fromStatus)} → ${statusLabel(toStatus)}`;
  }

  message += ` · ${formatDistanceToNow(new Date(createdAt), { addSuffix: true })}`;
  return message;
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), 'MMM d, yyyy');
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), 'MMM d, yyyy HH:mm');
}
