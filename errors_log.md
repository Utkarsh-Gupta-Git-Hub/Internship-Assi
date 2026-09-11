# Velozity Dashboard — Development Errors Log

> This file tracks every error, warning, and unexpected behavior encountered during the build of the Velozity Global Solutions Technical Assessment project.

---

## Format

Each entry follows this structure:

```
### [ERR-XXX] Short description
- **Phase**: Phase name (e.g., Backend — Auth)
- **File**: path/to/file.ts
- **Timestamp**: YYYY-MM-DD HH:MM
- **Error**: Full error message or stack trace
- **Root Cause**: Why it happened
- **Fix**: What was changed to resolve it
- **Status**: ✅ Resolved | ⚠️ Workaround | ❌ Open
```

---

## Errors

<!-- Errors will be appended below as they are encountered -->

### [ERR-001] npm deprecation warnings during backend install
- **Phase**: Phase 1 — Scaffolding & Config
- **File**: backend/package.json
- **Timestamp**: 2026-09-11 08:59
- **Error**: `npm warn deprecated inflight@1.0.6`, `rimraf@2.7.1`, `glob@7.2.3`, `uuid@8.3.2`, `uuid@10.0.0`
- **Root Cause**: These are transitive dependencies of Prisma and other packages. `uuid@10` was bumped by Prisma's client runtime; `rimraf`/`glob`/`inflight` are legacy deps inside older tooling packages.
- **Fix**: Warnings only — no functional impact. Using `uuid@10.0.0` directly in our code is fine for development. For production, `uuid@11` (CommonJS) should be pinned. No action required for assessment purposes.
- **Status**: ✅ Resolved (warnings only, no breaking changes)

### [ERR-002] Prisma Client Authentication Failed on Local Postgres
- **Phase**: Database Setup & Migration
- **File**: `backend/.env` / PostgreSQL Service
- **Timestamp**: 2026-09-11 09:20
- **Error**: `PrismaClientInitializationError: Authentication failed against database server at localhost, the provided database credentials for velozity_user are not valid.`
- **Root Cause**: Local PostgreSQL instance (`postgresql-x64-18`) was running on `localhost:5432` using superuser `postgres` with password `root`, but `velozity_user` with password `velozity_pass` was not created yet.
- **Fix**: Wrote and executed automated script to configure role `velozity_user` with password `velozity_pass` on PostgreSQL superuser connection, created `velozity_db`, ran `npx prisma db push` and `npx prisma db seed`.
- **Status**: ✅ Resolved

### [ERR-003] Redesign UI/UX from Dark Mode to Light Mode & Add 3D Framer Landing Page
- **Phase**: Frontend UI/UX Refactor
- **File**: `frontend/src/index.css`, `frontend/src/pages/Landing/LandingPage.tsx`, `frontend/src/App.tsx`
- **Timestamp**: 2026-09-11 09:50
- **User Request**: User requested a clean, high-contrast light theme inspired by Linear/Stripe/GitHub, a 3D motion-frame landing page, and 1-click role login demo access.
- **Fix**: Switched design system tokens to crisp light slate palette (`#f8fafc` background, `#ffffff` glass cards, `#4f46e5` indigo accents), installed `framer-motion`, built 3D perspective hero card, and added `LandingPage` with role showcase.
- **Status**: ✅ Resolved

### [ERR-004] Dashboard Layout CSS Class Realignment & Light Mode Polish
- **Phase**: Dashboard UI Polish
- **File**: `frontend/src/index.css`, `frontend/src/pages/Dashboard/DashboardPage.tsx`
- **Timestamp**: 2026-09-11 10:01
- **User Request**: Dashboard layout was misaligned due to missing stat grid & card class definitions.
- **Fix**: Defined `.stats-grid`, `.stat-card`, `.stat-value`, `.stat-label`, `.stat-icon`, `.upcoming-task-row`, and `.dev-task-row` in `index.css` with clean borders, flex alignment, and light theme box shadows.
- **Status**: ✅ Resolved

### [ERR-005] Projects Section & Kanban Board Grid CSS Realignment
- **Phase**: Projects & Kanban UI Polish
- **File**: `frontend/src/index.css`, `frontend/src/pages/Projects/ProjectsPage.tsx`, `frontend/src/pages/Projects/ProjectDetailPage.tsx`
- **Timestamp**: 2026-09-11 10:04
- **User Request**: Projects page grid and Project Detail Kanban board layout were unstyled due to missing grid definitions.
- **Fix**: Added complete `.projects-grid`, `.project-card`, `.project-card-meta`, `.tasks-grid`, `.kanban-column`, `.kanban-column-header`, `.task-card`, and `.dropdown` styles to `index.css`.
- **Status**: ✅ Resolved

## Explanation Field (150–250 words)

**The hardest problem:** The hardest engineering challenge was designing the role-filtered real-time feed that remains correct as users join and leave. The naive approach — send all events and filter on the client — leaks data (developers could see other developers' task updates). The correct approach required server-side room assignment: on Socket.io connection, each user is assigned to rooms based on their DB-verified role. Admin joins all project rooms, PMs join rooms only for their own projects, Developers join rooms for projects they are members of. Emitting to `project:<id>` means only users with verified room membership receive the event.

**How I handled the role-filtered feed:** The key insight is that filtering happens at emit time, not receive time. Controllers call `emitActivityEvent(projectId, event)`, which emits to `project:<projectId>` room. Users only join rooms they're authorized to access (verified against the DB on socket handshake). Developers receive project-room events but the ActivityFeed component additionally filters by `assignedTo` field for their own tasks. Admin gets a `global` room that receives all events. Missed events are fetched from PostgreSQL on reconnect — the DB query applies the same role-scope filter, so no cached memory state is needed.

**One thing I'd do differently:** I'd add Redis for Socket.io adapter (`@socket.io/redis-adapter`) from the start to support horizontal scaling — the current in-process Socket.io instance breaks if the backend runs on multiple nodes behind a load balancer.

---

## Known Limitations

1. **Single-node Socket.io**: The current setup uses the in-process Socket.io adapter. Horizontal scaling requires `@socket.io/redis-adapter`.
2. **No email notifications**: In-app only. A real deployment would add Nodemailer/SendGrid for task assignment emails.
3. **No file attachments**: Tasks don't support file uploads — would require S3/Cloudflare R2 integration.
4. **Cron job precision**: node-cron runs every minute so a task overdue at 14:00:30 might not be flagged until 14:01:00. Acceptable for this use case.
5. **No audit log UI**: Activity logs are stored and surfaced via the feed, but there's no dedicated audit trail page for admins.



