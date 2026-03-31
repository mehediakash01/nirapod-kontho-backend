# Nirapod Kontho Backend

A comprehensive backend API for the Nirapod Kontho platform - a safety and support system connecting victims of violence with NGOs.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- PostgreSQL (Neon recommended for production)
- Stripe account (for payments)
- Google OAuth credentials (for authentication)

### Local Development

1. **Clone and Install**
```bash
cd d:\project\nirapod-kontho-backend
npm install
```

2. **Configure Environment**
```bash
# Copy example and update values
cp .env.example .env

# Update .env with your values:
# - DATABASE_URL (PostgreSQL connection)
# - STRIPE_SECRET_KEY
# - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
# - BETTER_AUTH_URL=http://localhost:5000
# - FRONTEND_URL=http://localhost:3000
```

3. **Database Setup**
```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npx prisma migrate deploy

# (Optional) Seed database
npx prisma db seed
```

4. **Start Development Server**
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

### Build for Production

```bash
npm run build
```

## 🌍 Deployment

### Deploy to Vercel

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

**Quick Deploy:**
```bash
npm install -g vercel
vercel --prod
```

**Via Git:**
Just push to your main branch and Vercel will auto-deploy based on `vercel.json` config.

### Pre-Deployment Checklist
- [ ] Review [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- [ ] Update environment variables in Vercel
- [ ] Test database connection
- [ ] Verify Stripe webhook configuration
- [ ] Test Google OAuth callback URL

## 📚 API Documentation

See [API_REFERENCE.md](./API_REFERENCE.md) for complete API documentation.

### Key Endpoints

| Feature | Endpoint | Method |
|---------|----------|--------|
| Health Check | `/health` | GET |
| Auth Session | `/api/auth/session` | GET |
| Create Report | `/api/reports` | POST |
| Get Reports | `/api/reports` | GET |
| Payment Checkout | `/api/payments/one-time-checkout` | POST |
| Manage NGOs | `/api/ngos` | GET/POST |
| Case Management | `/api/cases` | GET/POST |

## 🏗️ Project Structure

```
src/
├── app.ts                    # Express app configuration
├── server.ts                 # Server entry point
├── app/
│   ├── config/              # Configuration files
│   │   ├── auth.ts          # Better Auth setup
│   │   ├── prisma.ts        # Prisma Client setup
│   │   └── stripe.ts        # Stripe configuration
│   ├── middleware/          # Express middleware
│   │   ├── auth.ts          # Authentication middleware
│   │   ├── validationRequest.ts
│   │   └── globalErrorHandler.ts
│   ├── modules/             # Feature modules
│   │   ├── auth/            # Authentication
│   │   ├── report/          # Report management
│   │   ├── payment/         # Payment processing
│   │   ├── ngo/             # NGO management
│   │   ├── case/            # Case management
│   │   ├── notification/    # Notifications
│   │   ├── verification/    # Email verification
│   │   └── oauth/           # OAuth handling
│   └── utils/               # Shared utilities
└── types/                   # TypeScript type definitions

prisma/
├── schema.prisma            # Database schema
└── migrations/              # Database migrations
```

## 🔐 Security Features

- ✅ Rate limiting (100 req/15min)
- ✅ CORS protection
- ✅ Helmet security headers
- ✅ Input validation with Zod
- ✅ Role-based access control (RBAC)
- ✅ Secure session handling
- ✅ Password hashing
- ✅ HTTP-only cookies

## 🗄️ Database

### Schema
- Users (with roles: USER, NGO_ADMIN, MODERATOR, SUPER_ADMIN)
- Reports (with status: DRAFT, SUBMITTED, VERIFIED, REJECTED)
- Cases
- NGOs
- Payments
- Notifications
- Verification tokens

### Migrations
Run migrations automatically during build:
```bash
npm run build
```

Or manually:
```bash
npx prisma migrate deploy
```

## 💳 Payment Integration (Stripe)

### Features
- One-time donations
- Monthly subscriptions
- Webhook handling
- Payment history tracking
- Dashboard analytics

### Configuration
1. Get Stripe keys from [stripe.com/dashboard](https://stripe.com/dashboard)
2. Add to environment:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
3. Set webhook endpoint in Stripe Dashboard:
   - `https://your-domain.com/api/payments/webhook`

## 🔑 Authentication

### Methods Supported
- Email/Password (with Better Auth)
- Google OAuth

### Session Management
- HTTP-only cookies
- 7-day expiration
- Role enrichment in session endpoint

## 📧 Email Verification

- Automatic email verification on signup
- Verification tokens with 24-hour expiration
- Token-based email confirmation flow

## 🔔 Notifications

Real-time notification system for:
- Report status updates
- Case assignments
- Payment confirmations
- NGO messages

## 🧪 Testing

### Health Check
```bash
curl http://localhost:5000/health
```

### Create Test Report
```bash
curl -X POST http://localhost:5000/api/reports \
  -H "Content-Type: application/json" \
  -H "Cookie: session=<token>" \
  -d '{
    "title": "Test",
    "type": "HARASSMENT",
    "description": "Test report"
  }'
```

## 📊 Monitoring

### Health Endpoint
```bash
GET /health
```
Returns system status and database connection health.

### Logs
Development: `npm run dev` (console output)
Production: `vercel logs --tail`

### Performance Metrics
- Response times
- Error rates
- Database query performance
- Memory usage

## 🐛 Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL format
- Check Neon PostgreSQL dashboard
- Test connection: `npx prisma db execute --stdin`

### Auth Failures
- Verify BETTER_AUTH_URL matches deploy domain
- Check browser cookies are enabled
- Verify Google OAuth credentials

### Stripe Issues
- Check webhook endpoint configuration
- Verify STRIPE_WEBHOOK_SECRET is correct
- Review Stripe dashboard logs

### Build Failures
- Run `npm run build` locally first
- Check `dist/` folder is created
- Verify all dependencies in package.json

### CORS Errors
- Update FRONTEND_URL in environment
- Verify frontend domain is in CORS whitelist
- Check `src/app.ts` for allowed origins

## 📝 Environment Variables

See `.env.example` for all required variables:

```env
DATABASE_URL=             # PostgreSQL connection string
PORT=5000                 # Server port
NODE_ENV=production       # Environment
BETTER_AUTH_URL=          # Auth server URL
FRONTEND_URL=             # Frontend domain for CORS
STRIPE_SECRET_KEY=        # Stripe API key
STRIPE_WEBHOOK_SECRET=    # Stripe webhook secret
GOOGLE_CLIENT_ID=         # Google OAuth client ID
GOOGLE_CLIENT_SECRET=     # Google OAuth secret
```

## 🔄 CI/CD

Currently set up for:
- Vercel auto-deploy on push to main
- Automatic builds with `npm run build`
- Prisma migrations on deploy

## 📦 Dependencies

### Core
- **Express** - Web framework
- **Prisma** - Database ORM
- **Better Auth** - Authentication
- **Stripe** - Payment processing
- **Zod** - Input validation

### Middleware
- **CORS** - Cross-origin requests
- **Helmet** - Security headers
- **Morgan** - HTTP logging
- **Express Rate Limit** - Rate limiting

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/name`
2. Commit changes: `git commit -m "Add feature"`
3. Push to branch: `git push origin feature/name`
4. Open pull request

## 📄 License

This project is proprietary. All rights reserved.

## 👥 Team

- Backend Development: Nirapod Kontho Team
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
