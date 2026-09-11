import { PrismaClient, Role, TaskStatus, Priority, ProjectStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clean all tables in order
  await prisma.notification.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  const salt = await bcrypt.genSalt(12);
  const hashPw = (pw: string) => bcrypt.hash(pw, salt);

  // ─── Users ───
  console.log('Creating users...');

  const admin = await prisma.user.create({
    data: {
      email: 'admin@velozity.dev',
      passwordHash: await hashPw('Admin@123'),
      name: 'Arjun Sharma',
      role: Role.ADMIN,
    },
  });

  const pm1 = await prisma.user.create({
    data: {
      email: 'pm1@velozity.dev',
      passwordHash: await hashPw('PM@123456'),
      name: 'Priya Mehta',
      role: Role.PROJECT_MANAGER,
    },
  });

  const pm2 = await prisma.user.create({
    data: {
      email: 'pm2@velozity.dev',
      passwordHash: await hashPw('PM@123456'),
      name: 'Rohan Kapoor',
      role: Role.PROJECT_MANAGER,
    },
  });

  const dev1 = await prisma.user.create({
    data: {
      email: 'dev1@velozity.dev',
      passwordHash: await hashPw('Dev@123456'),
      name: 'Ananya Gupta',
      role: Role.DEVELOPER,
    },
  });

  const dev2 = await prisma.user.create({
    data: {
      email: 'dev2@velozity.dev',
      passwordHash: await hashPw('Dev@123456'),
      name: 'Kiran Patel',
      role: Role.DEVELOPER,
    },
  });

  const dev3 = await prisma.user.create({
    data: {
      email: 'dev3@velozity.dev',
      passwordHash: await hashPw('Dev@123456'),
      name: 'Ravi Kumar',
      role: Role.DEVELOPER,
    },
  });

  const dev4 = await prisma.user.create({
    data: {
      email: 'dev4@velozity.dev',
      passwordHash: await hashPw('Dev@123456'),
      name: 'Sneha Joshi',
      role: Role.DEVELOPER,
    },
  });

  console.log('✅ Users created');

  // ─── Clients ───
  const client1 = await prisma.client.create({
    data: {
      name: 'Anika Reddy',
      email: 'contact@finedge.io',
      company: 'FinEdge Technologies',
      phone: '+91-9876543210',
      createdBy: admin.id,
    },
  });

  const client2 = await prisma.client.create({
    data: {
      name: 'Marcus Chen',
      email: 'marcus@healthpulse.com',
      company: 'HealthPulse Inc.',
      phone: '+91-9123456789',
      createdBy: admin.id,
    },
  });

  const client3 = await prisma.client.create({
    data: {
      name: 'Sofia Laurent',
      email: 'sofia@retailnova.eu',
      company: 'RetailNova Europe',
      phone: '+33-612345678',
      createdBy: admin.id,
    },
  });

  console.log('✅ Clients created');

  // ─── Projects ───
  const now = new Date();
  const pastDate = (daysAgo: number) => new Date(now.getTime() - daysAgo * 86400000);
  const futureDate = (daysFromNow: number) => new Date(now.getTime() + daysFromNow * 86400000);

  const project1 = await prisma.project.create({
    data: {
      name: 'FinEdge Dashboard Revamp',
      description: 'Complete overhaul of the FinEdge analytics dashboard with real-time data feeds and modern UI.',
      clientId: client1.id,
      createdBy: pm1.id,
      status: ProjectStatus.ACTIVE,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'HealthPulse Mobile App',
      description: 'React Native mobile application for patient health monitoring with wearable device integration.',
      clientId: client2.id,
      createdBy: pm1.id,
      status: ProjectStatus.ACTIVE,
    },
  });

  const project3 = await prisma.project.create({
    data: {
      name: 'RetailNova E-Commerce Platform',
      description: 'Multi-vendor e-commerce platform with inventory management and analytics suite.',
      clientId: client3.id,
      createdBy: pm2.id,
      status: ProjectStatus.ACTIVE,
    },
  });

  // Project members
  await prisma.projectMember.createMany({
    data: [
      { projectId: project1.id, userId: dev1.id },
      { projectId: project1.id, userId: dev2.id },
      { projectId: project2.id, userId: dev2.id },
      { projectId: project2.id, userId: dev3.id },
      { projectId: project3.id, userId: dev3.id },
      { projectId: project3.id, userId: dev4.id },
    ],
  });

  console.log('✅ Projects and members created');

  // ─── Tasks — Project 1 ───
  const t1_1 = await prisma.task.create({
    data: {
      title: 'Design new chart components',
      description: 'Create reusable Recharts-based components for revenue, user growth, and churn metrics.',
      projectId: project1.id,
      assignedTo: dev1.id,
      createdBy: pm1.id,
      status: TaskStatus.DONE,
      priority: Priority.HIGH,
      dueDate: pastDate(10),
      isOverdue: false,
    },
  });

  const t1_2 = await prisma.task.create({
    data: {
      title: 'Implement WebSocket data feed',
      description: 'Connect dashboard panels to live market data stream via Socket.io.',
      projectId: project1.id,
      assignedTo: dev1.id,
      createdBy: pm1.id,
      status: TaskStatus.IN_REVIEW,
      priority: Priority.CRITICAL,
      dueDate: futureDate(2),
    },
  });

  const t1_3 = await prisma.task.create({
    data: {
      title: 'User authentication flow',
      description: 'JWT-based auth with MFA support and session management.',
      projectId: project1.id,
      assignedTo: dev2.id,
      createdBy: pm1.id,
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      dueDate: pastDate(2),
      isOverdue: true,  // Pre-seeded overdue task #1
    },
  });

  const t1_4 = await prisma.task.create({
    data: {
      title: 'Export reports to PDF/Excel',
      description: 'Allow dashboard users to export filtered data reports to PDF and Excel formats.',
      projectId: project1.id,
      assignedTo: dev2.id,
      createdBy: pm1.id,
      status: TaskStatus.TODO,
      priority: Priority.MEDIUM,
      dueDate: futureDate(14),
    },
  });

  const t1_5 = await prisma.task.create({
    data: {
      title: 'Performance optimization — lazy loading',
      description: 'Implement code splitting and lazy loading to reduce initial bundle size below 200KB.',
      projectId: project1.id,
      assignedTo: dev1.id,
      createdBy: pm1.id,
      status: TaskStatus.TODO,
      priority: Priority.LOW,
      dueDate: futureDate(21),
    },
  });

  // ─── Tasks — Project 2 ───
  const t2_1 = await prisma.task.create({
    data: {
      title: 'Setup React Native project structure',
      description: 'Initialize Expo project, configure navigation, and set up state management with Zustand.',
      projectId: project2.id,
      assignedTo: dev2.id,
      createdBy: pm1.id,
      status: TaskStatus.DONE,
      priority: Priority.HIGH,
      dueDate: pastDate(20),
      isOverdue: false,
    },
  });

  const t2_2 = await prisma.task.create({
    data: {
      title: 'BLE device integration',
      description: 'Integrate Bluetooth Low Energy scanner to pair and stream data from fitness wearables.',
      projectId: project2.id,
      assignedTo: dev3.id,
      createdBy: pm1.id,
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.CRITICAL,
      dueDate: pastDate(3),
      isOverdue: true,  // Pre-seeded overdue task #2
    },
  });

  const t2_3 = await prisma.task.create({
    data: {
      title: 'Health metrics dashboard screens',
      description: 'Build screens for heart rate, SpO2, steps, and sleep tracking with historical charts.',
      projectId: project2.id,
      assignedTo: dev2.id,
      createdBy: pm1.id,
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      dueDate: futureDate(5),
    },
  });

  const t2_4 = await prisma.task.create({
    data: {
      title: 'Push notification service',
      description: 'Setup Firebase Cloud Messaging for health alerts and medication reminders.',
      projectId: project2.id,
      assignedTo: dev3.id,
      createdBy: pm1.id,
      status: TaskStatus.TODO,
      priority: Priority.MEDIUM,
      dueDate: futureDate(10),
    },
  });

  const t2_5 = await prisma.task.create({
    data: {
      title: 'Offline data sync',
      description: 'Implement SQLite local storage with background sync when connectivity is restored.',
      projectId: project2.id,
      assignedTo: dev2.id,
      createdBy: pm1.id,
      status: TaskStatus.IN_REVIEW,
      priority: Priority.HIGH,
      dueDate: futureDate(7),
    },
  });

  // ─── Tasks — Project 3 ───
  const t3_1 = await prisma.task.create({
    data: {
      title: 'Multi-vendor product catalog API',
      description: 'Design REST API for nested category/product structure with vendor-level isolation.',
      projectId: project3.id,
      assignedTo: dev3.id,
      createdBy: pm2.id,
      status: TaskStatus.DONE,
      priority: Priority.HIGH,
      dueDate: pastDate(15),
    },
  });

  const t3_2 = await prisma.task.create({
    data: {
      title: 'Payment gateway integration',
      description: 'Integrate Stripe and Razorpay with webhook handlers for European and Indian markets.',
      projectId: project3.id,
      assignedTo: dev4.id,
      createdBy: pm2.id,
      status: TaskStatus.IN_REVIEW,
      priority: Priority.CRITICAL,
      dueDate: futureDate(3),
    },
  });

  const t3_3 = await prisma.task.create({
    data: {
      title: 'Inventory management system',
      description: 'Stock tracking, low-inventory alerts, and automated reorder triggers.',
      projectId: project3.id,
      assignedTo: dev3.id,
      createdBy: pm2.id,
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      dueDate: futureDate(8),
    },
  });

  const t3_4 = await prisma.task.create({
    data: {
      title: 'Vendor analytics dashboard',
      description: 'Per-vendor sales analytics with revenue breakdown, returns, and customer acquisition metrics.',
      projectId: project3.id,
      assignedTo: dev4.id,
      createdBy: pm2.id,
      status: TaskStatus.TODO,
      priority: Priority.MEDIUM,
      dueDate: futureDate(20),
    },
  });

  const t3_5 = await prisma.task.create({
    data: {
      title: 'Search & filtering with Elasticsearch',
      description: 'Full-text product search with faceted filters, spell correction, and personalized ranking.',
      projectId: project3.id,
      assignedTo: dev4.id,
      createdBy: pm2.id,
      status: TaskStatus.TODO,
      priority: Priority.LOW,
      dueDate: futureDate(30),
    },
  });

  console.log('✅ Tasks created');

  // ─── Activity Logs (pre-existing, not empty on first load) ───
  const logsData = [
    // Project 1
    {
      taskId: t1_1.id, projectId: project1.id, userId: dev1.id,
      action: 'moved', fromStatus: TaskStatus.IN_PROGRESS, toStatus: TaskStatus.IN_REVIEW,
      metadata: { taskTitle: t1_1.title, userName: dev1.name },
      createdAt: pastDate(12),
    },
    {
      taskId: t1_1.id, projectId: project1.id, userId: pm1.id,
      action: 'moved', fromStatus: TaskStatus.IN_REVIEW, toStatus: TaskStatus.DONE,
      metadata: { taskTitle: t1_1.title, userName: pm1.name },
      createdAt: pastDate(10),
    },
    {
      taskId: t1_2.id, projectId: project1.id, userId: dev1.id,
      action: 'moved', fromStatus: TaskStatus.TODO, toStatus: TaskStatus.IN_PROGRESS,
      metadata: { taskTitle: t1_2.title, userName: dev1.name },
      createdAt: pastDate(7),
    },
    {
      taskId: t1_2.id, projectId: project1.id, userId: dev1.id,
      action: 'moved', fromStatus: TaskStatus.IN_PROGRESS, toStatus: TaskStatus.IN_REVIEW,
      metadata: { taskTitle: t1_2.title, userName: dev1.name },
      createdAt: pastDate(1),
    },
    {
      taskId: t1_3.id, projectId: project1.id, userId: dev2.id,
      action: 'moved', fromStatus: TaskStatus.TODO, toStatus: TaskStatus.IN_PROGRESS,
      metadata: { taskTitle: t1_3.title, userName: dev2.name },
      createdAt: pastDate(5),
    },
    // Project 2
    {
      taskId: t2_1.id, projectId: project2.id, userId: dev2.id,
      action: 'moved', fromStatus: TaskStatus.IN_PROGRESS, toStatus: TaskStatus.IN_REVIEW,
      metadata: { taskTitle: t2_1.title, userName: dev2.name },
      createdAt: pastDate(22),
    },
    {
      taskId: t2_1.id, projectId: project2.id, userId: pm1.id,
      action: 'moved', fromStatus: TaskStatus.IN_REVIEW, toStatus: TaskStatus.DONE,
      metadata: { taskTitle: t2_1.title, userName: pm1.name },
      createdAt: pastDate(20),
    },
    {
      taskId: t2_2.id, projectId: project2.id, userId: dev3.id,
      action: 'moved', fromStatus: TaskStatus.TODO, toStatus: TaskStatus.IN_PROGRESS,
      metadata: { taskTitle: t2_2.title, userName: dev3.name },
      createdAt: pastDate(8),
    },
    {
      taskId: t2_5.id, projectId: project2.id, userId: dev2.id,
      action: 'moved', fromStatus: TaskStatus.IN_PROGRESS, toStatus: TaskStatus.IN_REVIEW,
      metadata: { taskTitle: t2_5.title, userName: dev2.name },
      createdAt: pastDate(2),
    },
    // Project 3
    {
      taskId: t3_1.id, projectId: project3.id, userId: dev3.id,
      action: 'moved', fromStatus: TaskStatus.IN_PROGRESS, toStatus: TaskStatus.IN_REVIEW,
      metadata: { taskTitle: t3_1.title, userName: dev3.name },
      createdAt: pastDate(17),
    },
    {
      taskId: t3_1.id, projectId: project3.id, userId: pm2.id,
      action: 'moved', fromStatus: TaskStatus.IN_REVIEW, toStatus: TaskStatus.DONE,
      metadata: { taskTitle: t3_1.title, userName: pm2.name },
      createdAt: pastDate(15),
    },
    {
      taskId: t3_2.id, projectId: project3.id, userId: dev4.id,
      action: 'moved', fromStatus: TaskStatus.TODO, toStatus: TaskStatus.IN_PROGRESS,
      metadata: { taskTitle: t3_2.title, userName: dev4.name },
      createdAt: pastDate(6),
    },
    {
      taskId: t3_2.id, projectId: project3.id, userId: dev4.id,
      action: 'moved', fromStatus: TaskStatus.IN_PROGRESS, toStatus: TaskStatus.IN_REVIEW,
      metadata: { taskTitle: t3_2.title, userName: dev4.name },
      createdAt: pastDate(1),
    },
  ];

  for (const log of logsData) {
    await prisma.activityLog.create({ data: log });
  }

  console.log('✅ Activity logs created');

  // ─── Notifications ───
  await prisma.notification.createMany({
    data: [
      {
        userId: dev1.id,
        title: 'New task assigned',
        message: `You have been assigned "${t1_5.title}" in ${project1.name}`,
        taskId: t1_5.id,
        read: false,
      },
      {
        userId: dev2.id,
        title: 'New task assigned',
        message: `You have been assigned "${t1_4.title}" in ${project1.name}`,
        taskId: t1_4.id,
        read: false,
      },
      {
        userId: pm1.id,
        title: 'Task ready for review',
        message: `"${t1_2.title}" has been moved to In Review by ${dev1.name}`,
        taskId: t1_2.id,
        read: false,
      },
      {
        userId: pm1.id,
        title: 'Task ready for review',
        message: `"${t2_5.title}" has been moved to In Review by ${dev2.name}`,
        taskId: t2_5.id,
        read: true,
      },
      {
        userId: pm2.id,
        title: 'Task ready for review',
        message: `"${t3_2.title}" has been moved to In Review by ${dev4.name}`,
        taskId: t3_2.id,
        read: false,
      },
      {
        userId: dev3.id,
        title: 'Task overdue',
        message: `"${t2_2.title}" is now overdue. Please update the status or request an extension.`,
        taskId: t2_2.id,
        read: false,
      },
      {
        userId: dev2.id,
        title: 'Task overdue',
        message: `"${t1_3.title}" is now overdue. Please update the status or request an extension.`,
        taskId: t1_3.id,
        read: false,
      },
    ],
  });

  console.log('✅ Notifications created');

  console.log('\n🎉 Seed complete!');
  console.log('\n📋 Test accounts:');
  console.log('   Admin:   admin@velozity.dev  / Admin@123');
  console.log('   PM 1:    pm1@velozity.dev    / PM@123456');
  console.log('   PM 2:    pm2@velozity.dev    / PM@123456');
  console.log('   Dev 1:   dev1@velozity.dev   / Dev@123456');
  console.log('   Dev 2:   dev2@velozity.dev   / Dev@123456');
  console.log('   Dev 3:   dev3@velozity.dev   / Dev@123456');
  console.log('   Dev 4:   dev4@velozity.dev   / Dev@123456');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
