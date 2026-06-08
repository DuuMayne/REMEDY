# REMEDY — Remediation Tracking

> **Status: On hold.** The backend API and data model are complete. The frontend dashboard is pending. REMEDY will be integrated into PRISM as a remediation workflow module. This repository is available for developers who want to contribute or use the API directly.

Tracks the remediation of access control findings through a strict, auditable workflow. When PRISM or an access review identifies a risk or an orphaned account, REMEDY receives it, assigns it to an owner, tracks it through resolution, and enforces that evidence is provided before an issue can be marked resolved.

Every status change is recorded with a timestamp and who made it — creating an immutable audit trail that satisfies "show me what you did to fix this" questions.

**What it enforces:**
- Issues must move through defined stages: `open → in_progress → resolved → verified → closed`
- Resolution requires attached evidence (e.g. screenshot of account deletion, ticket link) — except for confirmed false positives
- Resolved items must be independently verified before closing
- Rejection during verification sends the issue back to `in_progress`
- Closed items are read-only — the audit trail cannot be altered

---

## Table of Contents

1. [What you need before starting](#1-what-you-need-before-starting)
2. [Setup for development](#2-setup-for-development)
3. [Loading sample data](#3-loading-sample-data)
4. [API reference](#4-api-reference)
5. [Workflow rules](#5-workflow-rules)
6. [Integration with PRISM](#6-integration-with-prism)
7. [Roadmap](#7-roadmap)
8. [For developers](#8-for-developers)

---

## 1. What you need before starting

- Node.js 18 or later — check with `node --version`
- npm (comes with Node.js)

No Docker setup is provided yet — it will be added when the frontend is complete.

---

## 2. Setup for development

### Step 1 — Install Node.js

Download the LTS version from [nodejs.org](https://nodejs.org).

### Step 2 — Clone REMEDY

```bash
git clone https://github.com/DuuMayne/REMEDY.git
cd REMEDY
```

### Step 3 — Install dependencies

```bash
npm install
```

### Step 4 — Initialize the database

REMEDY uses SQLite via Prisma. This creates the database and runs migrations:

```bash
npx prisma migrate dev
```

### Step 5 — Start the development server

```bash
npm run dev
```

The API is now running at **[http://localhost:3000](http://localhost:3000)**.

The dashboard UI is not yet built — use the API directly or through a tool like [Postman](https://www.postman.com) or [Insomnia](https://insomnia.rest).

---

## 3. Loading sample data

To populate the database with example findings for development:

```bash
npm run seed
```

This creates sample issues in various workflow states so you can test the status transition rules and API responses without setting up a real integration.

---

## 4. API reference

All endpoints return JSON. Dates are ISO 8601 format.

### Issues

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/items` | List all issues (supports `?status=open` filter) |
| `GET` | `/api/items/:id` | Get a single issue with full history |
| `PUT` | `/api/items/:id/status` | Transition issue status |
| `PUT` | `/api/items/:id/assign` | Reassign to a different owner |
| `POST` | `/api/items/:id/evidence` | Attach evidence (file path, URL, or note) |
| `GET` | `/api/items/:id/evidence` | List all evidence for an issue |
| `POST` | `/api/items/:id/verify` | Verify resolution (pass or reject) |

### Ingestion

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ingest` | Create or update an issue from an external system |

The ingest endpoint is idempotent — sending the same finding twice (matched on `externalKey`) updates the existing issue rather than creating a duplicate.

**Example ingest payload:**
```json
{
  "externalKey": "PRISM-RISK-0042",
  "title": "Orphaned admin account: jsmith@company.com in GitHub",
  "description": "User jsmith was offboarded 45 days ago but retains admin access on 3 GitHub repositories",
  "severity": "high",
  "source": "PRISM",
  "category": "access_control"
}
```

### Dashboard

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard` | Summary metrics (open count, overdue, by severity) |
| `GET` | `/api/export` | Export all issues as JSON or CSV (`?format=csv`) |

### SLA policies

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/sla` | List all SLA policies |
| `POST` | `/api/sla` | Create a policy |
| `DELETE` | `/api/sla/:id` | Delete a policy |

**Example SLA policy:**
```json
{
  "severity": "critical",
  "category": "access_control",
  "dueDays": 3
}
```

SLA due dates are calculated automatically when an issue is ingested, based on the matching policy.

---

## 5. Workflow rules

REMEDY enforces these rules. Attempts to violate them return a `400` error with an explanation.

1. **Status transitions are one-way** — you cannot move backwards except from `resolved` back to `in_progress` (when verification is rejected)
2. **Resolution requires evidence** — a `PUT /status` to `resolved` is rejected if no evidence has been attached, unless `type` is `false_positive`
3. **Blocked issues require a comment** — if setting status to `blocked`, a comment explaining the blocker is required
4. **Verification is independent** — only users other than the issue assignee can verify resolution
5. **Closed issues are immutable** — no status changes, evidence additions, or reassignments are accepted

---

## 6. Integration with PRISM

REMEDY is designed to receive findings from PRISM (or any tool that can make HTTP POST requests).

**From PRISM**, when a risk scenario exceeds a threshold:
```bash
curl -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "externalKey": "PRISM-2026-Q2-003",
    "title": "Ransomware scenario ALE exceeds threshold",
    "severity": "high",
    "source": "PRISM",
    "category": "ransomware"
  }'
```

**From RETINA**, when an orphaned account is found:
```bash
curl -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "externalKey": "RETINA-OKTA-jsmith-github",
    "title": "Orphaned account: jsmith in GitHub",
    "severity": "medium",
    "source": "RETINA",
    "category": "access_control"
  }'
```

Both calls are idempotent — running the same check again won't create duplicate issues.

---

## 7. Roadmap

- [ ] Frontend dashboard (next milestone)
- [ ] Docker + docker-compose.yml
- [ ] Integration into PRISM as a built-in remediation tab
- [ ] Email/Slack notifications on assignment and SLA breach
- [ ] Bulk actions (reassign multiple, close all verified)
- [ ] PostgreSQL support for larger deployments

---

## 8. For developers

### Tech stack
- **Next.js 16** (App Router, TypeScript) — API routes only, no frontend pages yet
- **Prisma ORM** + SQLite (swappable to PostgreSQL with a config change)
- **Zod** for request validation
- **date-fns** for SLA date calculations

### Switching to PostgreSQL

In `prisma/schema.prisma`, change:
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```
to:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```
Then set `DATABASE_URL` to your PostgreSQL connection string and run `npx prisma migrate dev`.

### Project structure
```
app/api/        — Next.js API route handlers
app/lib/        — Business logic, SLA calculations, workflow validation
prisma/         — Schema and migrations
seed.ts         — Sample data for development
```

---

## License

Apache 2.0 with Commons Clause. Free to use and modify for internal purposes; selling as a product requires permission. See [LICENSE](LICENSE) for full terms.
