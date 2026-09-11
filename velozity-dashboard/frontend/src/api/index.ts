import api from './axios';
import type {
  ApiResponse, LoginResponse, User, Client, Project, Task,
  ActivityLog, Notification, AdminStats, PMStats, DevStats, TaskFilters,
} from '../types';

// ─── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post<ApiResponse<LoginResponse>>('/auth/login', { email, password }),
  logout: () => api.post<ApiResponse<null>>('/auth/logout'),
  refresh: () => api.post<ApiResponse<LoginResponse>>('/auth/refresh'),
  me: () => api.get<ApiResponse<User>>('/auth/me'),
};

// ─── Users ─────────────────────────────────────────────────────────────────────
export const usersApi = {
  list: (params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<User[]>>('/users', { params }),
  create: (data: Partial<User> & { password: string }) =>
    api.post<ApiResponse<User>>('/users', data),
  get: (id: string) => api.get<ApiResponse<User>>(`/users/${id}`),
  update: (id: string, data: Partial<User>) =>
    api.patch<ApiResponse<User>>(`/users/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse<null>>(`/users/${id}`),
  developers: () => api.get<ApiResponse<User[]>>('/users/developers'),
};

// ─── Clients ───────────────────────────────────────────────────────────────────
export const clientsApi = {
  list: () => api.get<ApiResponse<Client[]>>('/clients'),
  create: (data: Omit<Client, 'id' | 'createdBy' | 'createdAt' | '_count'>) =>
    api.post<ApiResponse<Client>>('/clients', data),
  get: (id: string) => api.get<ApiResponse<Client>>(`/clients/${id}`),
  update: (id: string, data: Partial<Client>) =>
    api.patch<ApiResponse<Client>>(`/clients/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse<null>>(`/clients/${id}`),
};

// ─── Projects ──────────────────────────────────────────────────────────────────
export const projectsApi = {
  list: () => api.get<ApiResponse<Project[]>>('/projects'),
  create: (data: { name: string; description?: string; clientId: string }) =>
    api.post<ApiResponse<Project>>('/projects', data),
  get: (id: string) => api.get<ApiResponse<Project>>(`/projects/${id}`),
  update: (id: string, data: Partial<Project>) =>
    api.patch<ApiResponse<Project>>(`/projects/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse<null>>(`/projects/${id}`),
  addMember: (projectId: string, userId: string) =>
    api.post<ApiResponse<null>>(`/projects/${projectId}/members`, { userId }),
  removeMember: (projectId: string, userId: string) =>
    api.delete<ApiResponse<null>>(`/projects/${projectId}/members/${userId}`),
  dashboardStats: () =>
    api.get<ApiResponse<AdminStats | PMStats | DevStats>>('/projects/dashboard/stats'),
};

// ─── Tasks ─────────────────────────────────────────────────────────────────────
export const tasksApi = {
  list: (projectId: string, filters?: TaskFilters) =>
    api.get<ApiResponse<Task[]>>(`/projects/${projectId}/tasks`, { params: filters }),
  create: (projectId: string, data: Partial<Task>) =>
    api.post<ApiResponse<Task>>(`/projects/${projectId}/tasks`, data),
  get: (projectId: string, taskId: string) =>
    api.get<ApiResponse<Task>>(`/projects/${projectId}/tasks/${taskId}`),
  updateStatus: (projectId: string, taskId: string, status: string) =>
    api.patch<ApiResponse<Task>>(`/projects/${projectId}/tasks/${taskId}/status`, { status }),
  update: (projectId: string, taskId: string, data: Partial<Task>) =>
    api.patch<ApiResponse<Task>>(`/projects/${projectId}/tasks/${taskId}`, data),
  delete: (projectId: string, taskId: string) =>
    api.delete<ApiResponse<null>>(`/projects/${projectId}/tasks/${taskId}`),
  activity: (projectId: string, taskId: string) =>
    api.get<ApiResponse<ActivityLog[]>>(`/projects/${projectId}/tasks/${taskId}/activity`),
};

// ─── Activity ──────────────────────────────────────────────────────────────────
export const activityApi = {
  feed: (params?: { limit?: number; cursor?: string }) =>
    api.get<ApiResponse<ActivityLog[]>>('/activity', { params }),
  missed: (since: string) =>
    api.get<ApiResponse<ActivityLog[]>>('/activity/missed', { params: { since } }),
};

// ─── Notifications ─────────────────────────────────────────────────────────────
export const notificationsApi = {
  list: (params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<Notification[]>>('/notifications', { params }),
  count: () => api.get<ApiResponse<{ count: number }>>('/notifications/count'),
  markRead: (notificationId?: string, all?: boolean) =>
    api.patch<ApiResponse<null>>('/notifications/read', { notificationId, all }),
};
