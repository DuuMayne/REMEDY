# REMEDY

**Remediation tracking for access control findings.**

REMEDY is an opinionated workflow application for tracking remediation of access control issues identified by PRISM or similar risk/access review tools. It is NOT a generic ticketing system — it enforces a specific compliance-oriented workflow with immutable audit history.

## Why This Exists

Auditors don't just want to know you found a problem — they want to see how you tracked it to closure, who was responsible, what evidence was collected, and that the fix was independently verified. Most teams track remediation in Jira or a spreadsheet, which means the audit trail is whatever someone remembered to write in a comment, status transitions have no enforcement, and evidence is a link to a Confluence page that may or may not still exist.

REMEDY was built by a GRC practitioner who needed a remediation workflow that satisfies auditor expectations by default: constrained status transitions, mandatory evidence before resolution, immutable history, and SLA tracking tied to severity. It's opinionated because compliance workflows should be — the constraints exist for a reason.

## Status: On Hold

This application is scaffolded with a complete backend but frontend is pending. The plan is to integrate remediation tracking directly into PRISM instead of running as a standalone app.

## What it does

- Receives findings from PRISM via REST API
- Tracks remediation items through a constrained workflow (open -> in_progress -> resolved -> verified -> closed)
- Enforces business rules (evidence required, blocked needs comment, etc.)
- Calculates SLA due dates from severity and finding type
- Maintains immutable audit history for every status/owner change
- Supports evidence capture and verification workflow
- Provides dashboard metrics and audit export

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/ingest` | POST | Ingest finding from PRISM (idempotent) |
| `/api/items` | GET | List items with filtering |
| `/api/items/[id]` | GET | Item detail with full history |
| `/api/items/[id]/status` | PUT | Update status (with transition validation) |
| `/api/items/[id]/assign` | PUT | Reassign owner |
| `/api/items/[id]/evidence` | POST/GET | Add/list evidence |
| `/api/items/[id]/verify` | POST | Verify resolution |
| `/api/dashboard` | GET | Metrics summary |
| `/api/export` | GET | Audit export (JSON or CSV) |
| `/api/sla` | GET/POST/DELETE | Manage SLA policies |
| `/api/users` | GET/POST | Manage users |

## Setup (if resuming development)

```bash
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Open http://localhost:3000

## Tech Stack

- Next.js 16 (App Router, TypeScript)
- Prisma ORM + SQLite (swap to Postgres by changing one line in prisma.config.ts)
- Zod for validation
- Tailwind CSS
- date-fns

## Architecture

```
src/
├── app/api/          # REST endpoints
├── lib/
│   ├── db.ts         # Prisma client singleton
│   ├── workflow.ts   # Status transitions, business rules
│   ├── sla.ts        # Due date calculation
│   └── validation.ts # Zod schemas
├── generated/prisma/ # Prisma client (generated)
```

## Business Rules

1. Ingestion is idempotent by externalKey
2. Status transitions are constrained (see workflow.ts)
3. Blocked items require a comment
4. Resolved items require evidence (unless false_positive)
5. Verification rejection moves item back to in_progress
6. Closed items are read-only
7. Every status/owner change creates audit history
8. Due dates auto-calculated from SLA policies

## Development

Designed, spec'd, and directed by a security/compliance practitioner. AI-assisted implementation using [Claude Code](https://claude.ai/code).

The workflow constraints, SLA model, evidence requirements, and audit trail design come from direct experience with what auditors expect to see during remediation reviews. The implementation was accelerated with AI tooling, but the business rules reflect real compliance requirements — not hypothetical ones.

## License

Apache 2.0 with Commons Clause — see [LICENSE](LICENSE).
