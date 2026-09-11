Velozity Dashboard
Real-time agency management dashboard with role-based permissions, live WebSocket feeds, and automated task tracking.

Built with React (TypeScript), Node.js (Express), Prisma ORM, PostgreSQL, and Socket.io.

Quick Start & Setup
Test Credentials
The database seeds with realistic multi-role accounts for testing permissions:

Role	Email	Password	Access Level
Admin	admin@velozity.dev	Admin@123	Full system access (users, clients, projects, tasks)
Project Manager	pm1@velozity.dev	PM@123456	Manage assigned projects, create tasks, assign developers
Project Manager	pm2@velozity.dev	PM@123456	Manage assigned projects & team members
Developer	dev1@velozity.dev	Dev@123456	Update status on assigned tasks, view personal feeds
Developer	dev2@velozity.dev	Dev@123456	Update status on assigned tasks
Option 1: Docker Compose (Recommended)
Clone & Configuration:

git clone <repo-url>
cd velozity-dashboard
cp backend/.env.example backend/.env
Launch Services:

docker compose up -d
Run Migrations & Seed Data:

docker exec -it velozity-backend npx prisma migrate deploy
docker exec -it velozity-backend npm run seed
Open http://localhost:3000 in your browser.

Option 2: Local Development Setup
Prerequisites
Node.js 20+
PostgreSQL 16 running on localhost:5432
1. Backend Setup
cd backend
cp .env.example .env

# Install dependencies
npm install

# Run database migrations & seed test accounts
npx prisma db push
npm run seed

# Start development server (runs on http://localhost:5000)
npm run dev
2. Frontend Setup
# Open a second terminal window
cd frontend
npm install

# Start Vite dev server (runs on http://localhost:5173)
npm run dev
Technical Architecture & Engineering Decisions
1. WebSocket Live Stream (Socket.io)
Room Scoping: Socket connections require a valid JWT handshake. Users automatically join rooms (project:<id>, user:<id>, global) based on DB-verified permissions.
Data Leak Prevention: Task updates and status changes are broadcasted only to authorization-scoped rooms so developers never receive unauthorized activity data for projects they aren't assigned to.
Reconnection Handling: On socket disconnect/reconnect, the client syncs recent activity from PostgreSQL via standard REST fallback endpoints to avoid missing state changes during transient network drops.
2. Automated Overdue Scheduler (node-cron)
A background cron worker runs every minute (*/1 * * * *) on the backend server.
It queries PostgreSQL for tasks where dueDate < NOW(), status != 'DONE', and isOverdue = false.
Matching tasks are atomically flagged as isOverdue = true in a single transaction, generating an audit activity log entry and broadcasting an overdue event over Socket.io to update client boards instantly.
3. Dual-Token JWT Authentication & Security
Short-lived Access Token (15 minutes): Carried in memory by the Axios client for API authorization.
Long-lived Refresh Token (7 days): Stored inside a secure, httpOnly, sameSite=strict cookie.
Token Rotation: Every /api/auth/refresh invocation revokes the old refresh token hash in PostgreSQL and issues a new token pair to prevent replay attacks.
Project Structure
velozity-dashboard/
├── backend/
│   ├── src/
│   │   ├── config/          # Database connection & env validation
│   │   ├── controllers/     # Express route handlers (Auth, Projects, Tasks, Users)
│   │   ├── jobs/            # Overdue task background scheduler (node-cron)
│   │   ├── middleware/      # JWT auth guard, role-based permission checks, error handling
│   │   ├── socket/          # Socket.io server logic & room manager
│   │   └── utils/           # JWT helpers & error utilities
│   └── prisma/
│       ├── schema.prisma    # Database models, relations & explicit indexes
│       └── seed.ts          # Multi-role database seed script
└── frontend/
    └── src/
        ├── api/             # Axios instance & typed API request handlers
        ├── components/      # Reusable UI components, Activity Feed, Modals
        ├── contexts/        # Auth, Socket.io connection, and Notification providers
        ├── pages/           # Route views (Landing, Auth, Dashboard, Projects, Tasks)
        └── types/           # TypeScript interfaces
Database Design & Indexing
The schema uses PostgreSQL with explicit indexing on high-frequency queries:

User: @unique index on email for \(O(1)\) login lookup.
RefreshToken: @unique index on tokenHash and @index on userId for session revocation.
Task:
@@index([projectId]): Fast project-scoped task list joins.
@@index([assignedTo]): Accelerated queries for developer task views.
@@index([dueDate, isOverdue]): Composite index for the background overdue cron job.
ActivityLog: Composite descending index @@index([projectId, createdAt(sort: Desc)]) for real-time feed rendering.
Key Technical Challenges & Solutions
Role-Filtered Activity Feed
Challenge: Preventing unauthorized activity log leakage across roles without creating heavy server overhead.

Solution: Activity events are filtered at emit time on the server rather than sending global events to the client. Controllers invoke emitActivityEvent(projectId, event) which targets the Socket.io project:<projectId> room. Users only join rooms for projects they have explicit DB permission to access. When a developer views their personal workspace, the client feed filters incoming events against their assigned task IDs.

Overdue Task State Consistency
Challenge: Keeping task status consistent between client-side timers and server-side DB state across timezone differences.

Solution: Overdue calculation is treated as a server-authoritative state. The server cron job modifies isOverdue in PostgreSQL and emits a task:overdue event. The client updates UI badges automatically upon receiving the socket payload or reloading the task board.

License
MIT
