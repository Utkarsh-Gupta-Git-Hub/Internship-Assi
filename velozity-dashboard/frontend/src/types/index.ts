// ─── Enums (mirrored from Prisma schema) ───────────────────────────────────────
export enum Role {
  ADMIN = 'ADMIN',
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  DEVELOPER = 'DEVELOPER',
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE',
  OVERDUE = 'OVERDUE',
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

// ─── Base types ────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  isOnline: boolean;
  lastSeen: string | null;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
  phone?: string;
  createdBy: string;
  createdAt: string;
  _count?: { projects: number };
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  clientId: string;
  createdBy: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  client?: Pick<Client, 'id' | 'name' | 'company'>;
  manager?: Pick<User, 'id' | 'name' | 'email'>;
  members?: { userId: string; user: Pick<User, 'id' | 'name' | 'email' | 'role'> }[];
  _count?: { tasks: number; members: number };
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  assignedTo?: string | null;
  createdBy: string;
  status: TaskStatus;
  priority: Priority;
  dueDate?: string | null;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
  assignee?: Pick<User, 'id' | 'name' | 'email'> | null;
  creator?: Pick<User, 'id' | 'name'>;
  project?: Pick<Project, 'id' | 'name'>;
  activityLogs?: ActivityLog[];
  _count?: { activityLogs: number };
}

export interface ActivityLog {
  id: string;
  taskId: string;
  projectId: string;
  userId: string;
  action: string;
  fromStatus?: TaskStatus | null;
  toStatus?: TaskStatus | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
  user?: Pick<User, 'id' | 'name'>;
  task?: Pick<Task, 'id' | 'title'>;
  project?: Pick<Project, 'id' | 'name'>;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  taskId?: string | null;
  createdAt: string;
  task?: Pick<Task, 'id' | 'title' | 'projectId'> | null;
}

// ─── API Response types ────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    unreadCount?: number;
    nextCursor?: string | null;
  };
}

// ─── Auth types ────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

// ─── Dashboard stats ───────────────────────────────────────────────────────────
export interface AdminStats {
  totalProjects: number;
  tasksByStatus: { status: TaskStatus; _count: { status: number } }[];
  overdueCount: number;
  onlineUsers: number;
}

export interface PMStats {
  myProjects: number;
  tasksByPriority: { priority: Priority; _count: { priority: number } }[];
  upcomingTasks: Task[];
}

export interface DevStats {
  myTasks: Task[];
}

// ─── Socket events ─────────────────────────────────────────────────────────────
export interface SocketActivityEvent {
  id: string;
  taskId: string;
  projectId: string;
  taskTitle: string;
  userName: string;
  userId: string;
  action: string;
  fromStatus?: TaskStatus | null;
  toStatus?: TaskStatus | null;
  assignedTo?: string | null;
  createdAt: string;
}

// ─── Filter types ──────────────────────────────────────────────────────────────
export interface TaskFilters {
  status?: TaskStatus;
  priority?: Priority;
  dueDateFrom?: string;
  dueDateTo?: string;
  page?: number;
  limit?: number;
}
