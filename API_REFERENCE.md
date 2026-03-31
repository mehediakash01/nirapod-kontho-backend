# Nirapod Kontho Backend - API Reference

**Base URL**: `https://your-backend-domain.vercel.app` (when deployed)

## Authentication Endpoints

### Sign Up
- **Endpoint**: `POST /api/auth/sign-up/email`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securePassword123",
    "name": "User Name"
  }
  ```
- **Response**: `201 Created` with user and session data

### Sign In
- **Endpoint**: `POST /api/auth/sign-in/email`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securePassword123"
  }
  ```
- **Response**: `200 OK` with user and session data

### Get Session
- **Endpoint**: `GET /api/auth/session`
- **Headers**: Cookie with session token
- **Response**: `200 OK` with user data including role
- **Status Codes**:
  - `200`: Valid active session
  - `401`: No active session or session expired

### Google OAuth
- **Endpoint**: `GET /api/auth/signin/oauth/google`
- **Response**: OAuth callback handler

## Report Endpoints

### Create Report (USER)
- **Endpoint**: `POST /api/reports`
- **Auth**: Required (Cookie)
- **Body**:
  ```json
  {
    "title": "Report Title",
    "type": "HARASSMENT|DOMESTIC_VIOLENCE|STALKING|CORRUPTION|THREAT",
    "description": "Detailed description",
    "location": "Report location"
  }
  ```

### Get My Reports (USER)
- **Endpoint**: `GET /api/reports/my`
- **Auth**: Required (Cookie)
- **Query**: `?page=1&limit=10`

### Get Pending Reports (MODERATOR/SUPER_ADMIN)
- **Endpoint**: `GET /api/reports/pending`
- **Auth**: Required (MODERATOR role minimum)
- **Query**: `?page=1&limit=10`

### Update Report Status (MODERATOR/SUPER_ADMIN)
- **Endpoint**: `PATCH /api/reports/:id/status`
- **Auth**: Required (MODERATOR role minimum)
- **Body**:
  ```json
  {
    "status": "DRAFT|SUBMITTED|VERIFIED|REJECTED",
    "notes": "Status update notes"
  }
  ```

### Assign NGO to Report (SUPER_ADMIN)
- **Endpoint**: `PATCH /api/reports/:id/assign`
- **Auth**: Required (SUPER_ADMIN only)
- **Body**:
  ```json
  {
    "ngoId": "ngo_uuid"
  }
  ```

### Get Assignment Recommendations (SUPER_ADMIN)
- **Endpoint**: `GET /api/reports/:id/recommendations`
- **Auth**: Required (SUPER_ADMIN only)

### Get All Reports (ADMIN/MODERATOR)
- **Endpoint**: `GET /api/reports`
- **Auth**: Required (SUPER_ADMIN or MODERATOR)
- **Query**: `?page=1&limit=10&status=SUBMITTED`

## Payment Endpoints

### Create One-Time Checkout
- **Endpoint**: `POST /api/payments/one-time-checkout`
- **Auth**: Required (Cookie)
- **Body**:
  ```json
  {
    "amount": 5000
  }
  ```
- **Response**: Stripe Checkout Session URL

### Create Monthly Subscription
- **Endpoint**: `POST /api/payments/monthly-subscription`
- **Auth**: Required (Cookie)
- **Body**:
  ```json
  {
    "amount": 1000
  }
  ```
- **Response**: Stripe Checkout Session URL

### Get My Donation History
- **Endpoint**: `GET /api/payments/my-history`
- **Auth**: Required (Cookie)
- **Query**: `?page=1&limit=20`

### Get Donation Dashboard (SUPER_ADMIN)
- **Endpoint**: `GET /api/payments/dashboard`
- **Auth**: Required (SUPER_ADMIN only)
- **Response**: Analytics and donation statistics

### Stripe Webhook
- **Endpoint**: `POST /api/payments/webhook`
- **Headers**: `stripe-signature`
- **Handled Events**:
  - `charge.succeeded`
  - `charge.failed`
  - `customer.subscription.created`
  - `customer.subscription.deleted`

## NGO Endpoints

### Get All NGOs
- **Endpoint**: `GET /api/ngos`
- **Auth**: Required (Cookie)
- **Query**: `?page=1&limit=10&search=ngo_name`

### Get NGO Analytics (SUPER_ADMIN)
- **Endpoint**: `GET /api/ngos/analytics/summary`
- **Auth**: Required (SUPER_ADMIN only)

### Create NGO with Admin (SUPER_ADMIN)
- **Endpoint**: `POST /api/ngos/create-with-admin`
- **Auth**: Required (SUPER_ADMIN only)
- **Body**:
  ```json
  {
    "name": "NGO Name",
    "email": "admin@ngo.com",
    "adminName": "Admin Name",
    "phone": "+1234567890"
  }
  ```

### Get NGO Profile
- **Endpoint**: `GET /api/ngos/:id`
- **Auth**: Required (Cookie)

### Update NGO Profile
- **Endpoint**: `PATCH /api/ngos/:id`
- **Auth**: Required (NGO_ADMIN or SUPER_ADMIN)
- **Body**: NGO fields to update

## Case Endpoints

### Create Case
- **Endpoint**: `POST /api/cases`
- **Auth**: Required (NGO_ADMIN or SUPER_ADMIN)
- **Body**:
  ```json
  {
    "reportId": "report_uuid",
    "caseNumber": "CASE-001",
    "title": "Case Title",
    "description": "Case details"
  }
  ```

### Get Cases
- **Endpoint**: `GET /api/cases`
- **Auth**: Required (Cookie)
- **Query**: `?page=1&limit=10&status=OPEN`

### Get Case Details
- **Endpoint**: `GET /api/cases/:id`
- **Auth**: Required (Cookie)

### Update Case Status
- **Endpoint**: `PATCH /api/cases/:id`
- **Auth**: Required (NGO_ADMIN or SUPER_ADMIN)
- **Body**:
  ```json
  {
    "status": "OPEN|IN_PROGRESS|RESOLVED|CLOSED"
  }
  ```

## Verification Endpoints

### Send Verification Email
- **Endpoint**: `POST /api/verification/send`
- **Auth**: Required (Cookie)

### Verify Email
- **Endpoint**: `POST /api/verification/verify`
- **Auth**: Not required
- **Body**:
  ```json
  {
    "token": "verification_token"
  }
  ```

### Check Verification Status
- **Endpoint**: `GET /api/verification/status`
- **Auth**: Required (Cookie)

## Notification Endpoints

### Get Notifications
- **Endpoint**: `GET /api/notifications`
- **Auth**: Required (Cookie)
- **Query**: `?page=1&limit=20&unread=true`

### Mark Notification as Read
- **Endpoint**: `PATCH /api/notifications/:id/read`
- **Auth**: Required (Cookie)

### Delete Notification
- **Endpoint**: `DELETE /api/notifications/:id`
- **Auth**: Required (Cookie)

## System Endpoints

### Health Check
- **Endpoint**: `GET /health`
- **Auth**: Not required
- **Response Uses only fresh data):
  ```json
  {
    "status": "ok",
    "timestamp": "2026-03-31T10:30:00Z",
    "uptime": 3600,
    "environment": "production"
  }
  ```

### API Status
- **Endpoint**: `GET /`
- **Auth**: Not required
- **Response**: Plain text message

## Error Responses

All endpoints follow this error format:

```json
{
  "success": false,
  "message": "Error message",
  "error": {
    "statusCode": 400,
    "message": "Detailed error message"
  }
}
```

### Common Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

## Rate Limiting

- **Limit**: 100 requests per 15 minutes per IP
- **Headers**: 
  - `X-RateLimit-Limit: 100`
  - `X-RateLimit-Remaining: 95`
  - `X-RateLimit-Reset: 1234567890`

## Authentication

### Cookie-Based Sessions
- Session token is stored in HTTP-only cookies
- Send cookies automatically with requests from browser
- Verified on each protected endpoint

### Required Headers
```
Cookie: session=<token>
Content-Type: application/json
```

## User Roles

| Role | Permissions |
|------|-------------|
| USER | View own reports, create reports, donate |
| NGO_ADMIN | Manage NGO, view assigned cases, manage cases |
| MODERATOR | Verify reports, view pending reports |
| SUPER_ADMIN | Full access, manage all reports, manage NGOs |

## Testing with cURL

### Test Health
```bash
curl https://your-backend-domain.vercel.app/health
```

### Test Auth Session (requires valid session)
```bash
curl -b "Cookie: session=<token>" \
  https://your-backend-domain.vercel.app/api/auth/session
```

### Create Report
```bash
curl -X POST https://your-backend-domain.vercel.app/api/reports \
  -H "Content-Type: application/json" \
  -H "Cookie: session=<token>" \
  -d '{
    "title": "Test Report",
    "type": "HARASSMENT",
    "description": "Test description",
    "location": "Test location"
  }'
```

## WebSocket Endpoints

Currently, WebSocket support is not implemented. Future versions may include:
- Real-time notifications
- Live case updates
- Chat functionality

## Pagination

Most list endpoints support pagination:

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `sort`: Sort field (default: created_at)
- `order`: asc or desc (default: desc)

**Response Format**:
```json
{
  "success": true,
  "data": [/* items */],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

## Versioning

Current API Version: **v1**

Future versions will be available at:
- `https://your-backend-domain.vercel.app/api/v1/...`
- `https://your-backend-domain.vercel.app/api/v2/...`

## Support

For API issues:
1. Check this documentation
2. Review server logs: `vercel logs --tail`
3. Check database connection: `curl https://your-backend-domain.vercel.app/health`
4. Contact: support@nirapod-kontho.com
