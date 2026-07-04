# Project 04 — Customer Support & SLA Desk

| | |
|---|---|
| **Type** | Fullstack |
| **Difficulty** | Advanced Intermediate |
| **Database** | PostgreSQL + Redis |
| **Best for** | Strong junior or early mid-level fullstack developers who want a business workflow project |

## One-line summary

A support platform where customers create tickets and agents manage assignments, SLA timers, comments, attachments, and realtime status changes.

---

## What this project is

Build separate **customer** and **agent** experiences around support tickets.

**Customers** can:

- Create tickets
- Track their own issues
- Reply on public threads
- Attach files

**Agents** can:

- Assign tickets
- Reply with internal notes
- Escalate issues
- Filter and search
- Manage SLA deadlines

---

## Why this project stands out

This is better than a broad Jira or Trello clone because the domain is narrower and more realistic:

- Customer portal
- Agent workflow
- SLA rules
- Realtime updates
- Attachments
- Role-based access
- Audit history

It shows product thinking plus engineering discipline.

---

## Recommended stack

- Next.js App Router + TypeScript
- Tailwind CSS + shadcn/ui
- TanStack Query
- Zustand for filters / sidebar / realtime state
- NestJS API or Go API
- PostgreSQL + Prisma / sqlc
- Redis for queues, rate limiting, cache, WebSocket scaling
- Socket.IO or native WebSocket
- R2 / S3 for attachments
- Jest + Playwright

## Alternative stacks

- Node.js + Express (smaller version)
- Go API (strong backend variety)
- Spring Boot or FastAPI

Use **PostgreSQL** regardless of backend language — ticket workflow is relational.

---

## Core requirements (MVP)

- [ ] Customer signup / login
- [ ] Agent / admin login
- [ ] Create ticket with title, description, category, priority
- [ ] Attach files to ticket
- [ ] Ticket statuses: open, pending, resolved, closed
- [ ] Assign ticket to agent or team
- [ ] Internal notes visible only to agents
- [ ] Public replies visible to customers
- [ ] SLA due time based on priority
- [ ] Agent dashboard with filters
- [ ] Customer portal showing own tickets
- [ ] Realtime ticket updates using WebSockets

## Portfolio plus (optional)

- [ ] Email-to-ticket mock endpoint
- [ ] Canned replies
- [ ] Tagging and saved filters
- [ ] SLA breach worker
- [ ] Escalation notification queue
- [ ] Full-text search
- [ ] Audit log and status history timeline
- [ ] Rate limit ticket creation

---

## Responsibilities you will learn

### Backend

- Separate customer and agent permissions
- Use a ticket status state machine
- Prevent invalid status jumps
- Use workers for SLA breach checks
- Emit WebSocket events only after DB commit succeeds
- Keep comments immutable or softly deleted
- Add full-text search indexes
- Validate attachment limits and generate signed URLs
- Store ticket status history
- Rate-limit ticket creation and replies

### Frontend

- Build separate customer portal and agent dashboard layouts
- Use TanStack Query cache for tickets and comments
- Safely update cache from realtime events
- Store filters in URL query params
- Use optimistic UI for replies with rollback
- Show SLA timers clearly in rows / cards
- Build role-aware navigation and buttons
- Add professional empty / loading / error states
- Use forms with validation for tickets and replies
- Render incident-like timeline for ticket history

---

## Database choice

**PostgreSQL** fits because tickets, comments, assignments, status history, SLA policies, teams, users, and reporting are relational.

**Redis** supports:

- Realtime fanout
- Queues
- Rate limiting
- Notifications

---

## Key skills

Next.js · Go/Nest API · PostgreSQL · Redis · WebSocket · SLA Workers · RBAC

---

## What this proves to recruiters

This shows product thinking and fullstack ownership: you understand both customer simplicity and internal agent workflow.

## Sample resume bullet

> Built a Customer Support & SLA Desk using Next.js, PostgreSQL, Redis, and a NestJS/Go API; implemented customer and agent portals, RBAC, ticket workflow, SLA timers, attachments, realtime updates, workers, and audit history.

---

## Portfolio checklist

- [ ] Deployed demo with customer + agent views
- [ ] README with role diagram
- [ ] SLA logic documented
- [ ] Realtime update flow explained
- [ ] E2E or integration tests for ticket lifecycle
- [ ] Resume bullet ready
