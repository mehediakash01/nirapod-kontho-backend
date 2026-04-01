# Nirapod Kontho Backend

Production API service for Nirapod Kontho, built with Express + TypeScript + Prisma.
This service handles authentication, role-based access, incident reporting, moderation and verification, NGO assignment and case operations, notifications, and Stripe-powered donations.

## What This Backend Does

- Authenticates users with Better Auth (email/password + Google OAuth).
- Accepts safety incident reports with structured metadata and evidence links.
- Enables moderators to verify or reject reports.
- Enables super admins to assign verified reports to NGOs.
- Enables NGO admins to process assigned cases and add case notes.
- Sends user notifications for key transitions.
- Handles one-time and subscription donations through Stripe.
- Exposes admin analytics for operations and donations.

## Runtime Stack

- Language: TypeScript
- Runtime: Node.js (target Node 20 build)
- API Framework: Express 5
- ORM/DB: Prisma + PostgreSQL (Neon-friendly)
- Auth: Better Auth + Prisma adapter
- Payments: Stripe
- Validation: Zod
- Security middleware: Helmet, CORS, express-rate-limit
- Build tool: tsup
- Hosting target: Vercel serverless (`vercel.json` routes all traffic to `src/server.ts`)

## High-Level Architecture

1. Incoming request enters Express app in `src/app.ts`.
2. Security middlewares run (`cors`, `helmet`, `morgan`, rate limiter).
3. Route-level middleware enforces auth and role checks.
4. Zod validation guards typed payloads.
5. Controller delegates to service layer.
6. Service layer executes Prisma queries and transactional workflows.
7. Standardized JSON response is returned through `sendResponse`.
8. Unhandled errors are normalized in `globalErrorHandler`.

## Folder Structure (Backend)

```text
nirapod-kontho-backend/
|-- api/
|   |-- server.mjs                       # Build output entry for deployment runtime
|-- prisma/
|   |-- schema.prisma                    # Database models and enums
|   |-- migrations/                      # Prisma migration history
|-- src/
|   |-- server.ts                        # Runtime bootstrap, graceful shutdown
|   |-- app.ts                           # Express app wiring, routes, middlewares
|   |-- app/
|   |   |-- config/
|   |   |   |-- auth.ts                  # Better Auth configuration
|   |   |   |-- prisma.ts                # Prisma client + adapter singleton
|   |   |   |-- stripe.ts                # Stripe client initialization
|   |   |-- middleware/
|   |   |   |-- auth.ts                  # authenticate + requireRole
|   |   |   |-- validationRequest.ts     # Zod request validator
|   |   |   |-- globalErrorHandler.ts    # Central error responder
|   |   |-- errors/
|   |   |   |-- AppError.ts              # Typed operational errors
|   |   |-- utils/
|   |   |   |-- catchAsync.ts            # Async error wrapper
|   |   |   |-- sendResponse.ts          # Consistent response formatter
|   |   |   |-- queryBuilder.ts          # Pagination helper
|   |   |-- modules/
|   |   |   |-- report/                  # Report create/list/assignment logic
|   |   |   |-- verification/            # Moderator verification workflows
|   |   |   |-- ngo/                     # NGO onboarding + analytics
|   |   |   |-- case/                    # NGO case lifecycle + notes
|   |   |   |-- notification/            # User notifications
|   |   |   |-- payment/                 # Stripe checkout + webhook + dashboard
|   |   |   |-- oauth/                   # Custom OAuth helper/session flows
|   |-- types/
|   |   |-- express.d.ts                 # Express request augmentation
|-- vercel.json                          # Vercel build and route mapping
|-- package.json
|-- .env.example
```

## Core Domain and Data Model

Main entities from Prisma schema:

- `User`
- `Session`
- `Account`
- `NGO`
- `Report`
- `Evidence`
- `ReportVerification`
- `Case`
- `CaseNote`
- `Notification`
- `Donation`
- `AuditLog`

Important enums:

- `Role`: `SUPER_ADMIN`, `NGO_ADMIN`, `MODERATOR`, `USER`
- `ReportType`: `HARASSMENT`, `DOMESTIC_VIOLENCE`, `STALKING`, `CORRUPTION`, `THREAT`
- `ReportStatus`: `DRAFT`, `SUBMITTED`, `VERIFIED`, `REJECTED`
- `SeverityLevel`: `MILD`, `MODERATE`, `URGENT`
- `CaseStatus`: `UNDER_REVIEW`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`
- `PaymentStatus`: `PENDING`, `SUCCESS`, `FAILED`

## RBAC Matrix

- `USER`
  - Create report
  - View own reports
  - View own notifications
  - Donate and view own donation history
- `MODERATOR`
  - View pending reports
  - Verify/reject reports
  - View verification dashboard summaries
- `SUPER_ADMIN`
  - All moderator capabilities
  - Create NGO with admin
  - View NGO analytics summary
  - Assign/reassign NGO to verified reports
  - View assignment audit logs
  - View donation dashboard analytics
- `NGO_ADMIN`
  - View assigned cases
  - Update case status
  - Add case notes while updating status

## End-to-End Workflow

### 1. Authentication and Session

1. User signs up/signs in through Better Auth routes (or custom aliases).
2. Session token is issued and sent as cookie.
3. Middleware `authenticate` resolves active session and loads full user from DB.
4. `requireRole(...)` enforces endpoint-level authorization.

### 2. Report Lifecycle

1. Authenticated user submits report with type, details, location, severity, optional evidence links.
2. Report starts as `SUBMITTED`.
3. Moderator reviews and verifies or rejects.
4. If approved, report status becomes `VERIFIED`.
5. Super admin explicitly assigns verified report to an NGO (or reassigns).
6. A case is created/updated and reporter receives notification.
7. NGO admin advances case status and can leave note; reporter is notified.

### 3. Donation Lifecycle

1. User creates one-time checkout or monthly subscription checkout session.
2. Stripe handles payment UI.
3. Webhook updates donation records (`SUCCESS` or `FAILED`).
4. User can read personal donation history.
5. Super admin can read dashboard metrics and trends.

## API Base and Conventions

- Base URL (local): `http://localhost:5000`
- JSON APIs are under `/api/*`.
- Health endpoint: `/health`
- Standard response shape (most endpoints):

```json
{
  "success": true,
  "message": "...",
  "meta": {},
  "data": {}
}
```

- Validation failures return `400` with details from Zod.
- Unauthorized/forbidden return `401` or `403`.

## API Endpoint Catalog

### Public/Utility

- `GET /`
  - Basic liveness text.
- `GET /health`
  - Database connectivity + runtime metadata.

### Auth and Session

- `ALL /api/auth/signup`
  - Alias that rewrites to Better Auth `sign-up/email`.
- `ALL /api/auth/signin`
  - Alias that rewrites to Better Auth `sign-in/email`.
- `GET /api/auth/session`
  - Custom no-cache session endpoint returning enriched user role data.
- `ALL /api/auth`
- `ALL /api/auth/*`
  - Pass-through Better Auth handler endpoints.

### OAuth

- `GET /api/oauth/:provider`
  - Currently supports `google` and returns generated OAuth URL.
- `GET /api/oauth/callback/google`
  - Exchanges code, upserts user, creates session, sets cookie, redirects to frontend.
- `GET /api/oauth/session`
  - Reads session token from cookies and returns user/session info.

### Reports

- `POST /api/reports` (Authenticated user)
  - Create report.
  - Body:
    - `type`, `description`, `location`, `incidentDate`, `severity`
    - Optional: `latitude`, `longitude`, `voiceNoteUrl`, `evidenceFiles[]`, `isAnonymous`
- `GET /api/reports/my` (Authenticated user)
  - Fetch own reports.
- `GET /api/reports/pending` (Moderator/Super Admin)
  - Fetch pending reports.
- `PATCH /api/reports/:id/status` (Moderator/Super Admin)
  - Update via verification flow using `status` (`APPROVED` or `REJECTED`) and optional note.
- `PATCH /api/reports/:id/assign` (Super Admin)
  - Assign or reassign NGO to verified report.
  - Requires `assignmentRationale` and `confirmAssignment: true`.
- `GET /api/reports/:id/recommendations` (Super Admin)
  - NGO recommendation scores for verified report.
- `GET /api/reports/audit-logs/assignments` (Super Admin)
  - Latest assignment audit logs.
- `GET /api/reports` (Moderator/Super Admin)
  - Paginated/filterable list (`type`, `status`, `search`, `page`, `limit`).

### Verification

- `GET /api/verification/pending` (Moderator/Super Admin)
- `GET /api/verification/overview` (Moderator/Super Admin)
- `GET /api/verification/recent` (Moderator/Super Admin)
- `POST /api/verification` (Moderator/Super Admin)
  - Body: `reportId`, `status` (`APPROVED` or `REJECTED`), optional `feedback`, optional `rejectionReason`, optional `checklist[]`.

### NGO Management

- `POST /api/ngos/create-with-admin` (Super Admin)
  - Creates NGO and associated NGO admin account in one workflow.
- `GET /api/ngos` (NGO Admin/Moderator/Super Admin)
  - List NGOs with related cases.
- `GET /api/ngos/analytics/summary` (Super Admin)
  - Aggregated operational metrics.
- `GET /api/ngos/:id` (NGO Admin/Moderator/Super Admin)
  - Get single NGO + cases.

### Case Management

- `GET /api/cases/my` (NGO Admin)
  - Get assigned cases (filter by status and paginate via query options).
- `PATCH /api/cases/:id` (NGO Admin)
  - Update case status.
  - Optional `note` creates `CaseNote` and notifies reporter.

### Notifications

- `GET /api/notifications` (Authenticated user)
  - Get own notifications.
- `PATCH /api/notifications/:id/read` (Authenticated user)
  - Mark own notification as read.

### Payments

- `POST /api/payments/create-payment-intent` (Authenticated user)
- `POST /api/payments/confirm` (Authenticated user)
- `POST /api/payments/monthly-subscription` (Authenticated user)
- `POST /api/payments/one-time-checkout` (Authenticated user)
- `GET /api/payments/my-history` (Authenticated user)
- `GET /api/payments/dashboard` (Super Admin)
- `POST /api/payments/webhook` (Stripe)
  - Mounted before `express.json()` and uses raw body for signature verification.

## Environment Variables

Use `.env.example` as the source of truth.

```env
# Database
DATABASE_URL=postgresql://user:password@host/database?sslmode=verify-full&channel_binding=require

# Runtime
PORT=5000
NODE_ENV=production

# Auth and frontend integration
BETTER_AUTH_URL=https://your-backend-domain.com
FRONTEND_URL=https://your-frontend-domain.com
CLIENT_URL=https://your-frontend-domain.com

# Stripe
STRIPE_SECRET_KEY=sk_test_or_live_key
STRIPE_WEBHOOK_SECRET=whsec_secret

# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
```

## Local Development Setup

1. Install dependencies

```bash
npm install
```

2. Create environment file

```bash
cp .env.example .env
```

3. Generate Prisma client and apply migrations

```bash
npx prisma generate
npx prisma migrate deploy
```

4. Run in watch mode

```bash
npm run dev
```

5. Verify service health

```bash
curl http://localhost:5000/health
```

## Build and Deploy

### Build

```bash
npm run build
```

This command runs Prisma generate, then builds `src/server.ts` to `api/server.mjs` using tsup.

### Vercel Deployment Notes

- `vercel.json` points all routes to `src/server.ts` using `@vercel/node`.
- On Vercel runtime, `src/server.ts` avoids opening a local listener (`process.env.VERCEL` check).
- Ensure all environment variables are configured in Vercel project settings.
- Configure Stripe webhook to hit:
  - `https://<your-backend-domain>/api/payments/webhook`

## Security and Operational Considerations

- Global rate limiter: 100 requests per 15 minutes.
- CORS allowlist is controlled by `FRONTEND_URL` plus localhost fallback.
- Helmet is enabled globally.
- Input validation is enforced per endpoint with Zod.
- Role checks are centralized via middleware.
- Graceful Prisma disconnect on `SIGTERM`/`SIGINT`.
- Global handlers exit process on unhandled exceptions/rejections.

## Production Readiness Checklist

- Set strong, correct production environment variables.
- Use production Postgres with SSL.
- Verify Google OAuth redirect URI exactly matches backend callback.
- Verify Stripe webhook secret and event delivery.
- Confirm frontend domain is in CORS allowlist.
- Run migration pipeline before traffic cutover.
- Smoke test these paths after deploy:
  - `/health`
  - Auth sign-in + session
  - Report create and moderation
  - NGO assignment and case update
  - Donation checkout + webhook

## Known Gotchas

- Stripe webhook requires raw body and route order must not change.
- After Prisma schema changes, regenerate client and restart runtime.
- OAuth callback relies on `BETTER_AUTH_URL` and `FRONTEND_URL` consistency.
- Donation dashboard totals depend on webhook updates; missing webhook events will skew stats.

## Minimal API Smoke Commands

```bash
# Health
curl http://localhost:5000/health

# Root
curl http://localhost:5000/
```

## License

Proprietary project. All rights reserved.
- API Design: Platform Team
- DevOps: Infrastructure Team

## 💬 Support

For issues and questions:
- Create GitHub issue
- Contact: support@nirapod-kontho.com
- Check documentation: [DEPLOYMENT.md](./DEPLOYMENT.md) | [API_REFERENCE.md](./API_REFERENCE.md)

## 🔗 Related Repositories

- Frontend: [nirapod-kontho-frontend](../nirapod-kontho-frontend)
- Infrastructure: Contact admin

## 📅 Version History

- **v1.0.0** (Mar 31, 2026) - Initial release
  - Authentication with Better Auth
  - Report management system
  - Payment processing with Stripe
  - NGO management
  - Case management
  - Email verification
  - Notification system

---

**Last Updated**: March 31, 2026
**Status**: Production Ready ✓
