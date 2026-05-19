---
trigger: always_on
---

# architecture.md — SecureGate

## Overview

SecureGate follows a **layered server-first architecture** built on Next.js 14's App Router. The goal is strict separation of concerns: routes know nothing about the database, the database knows nothing about HTTP, and business logic lives in one place only.

---

## Architectural Principles

1. **Server-first** — Auth logic, token operations, and DB access are server-side only.
2. **Layered** — Each layer has a single responsibility and calls only the layer below it.
3. **Fail closed** — When in doubt, deny access. Security defaults are strict.
4. **No logic leakage** — Route handlers orchestrate; they do not implement.
5. **Single source of truth** — One place for DB queries, one place for validation schemas, one place for business logic.

---

## Layer Diagram

```
Browser / Client
      │
      ▼
┌─────────────────────────────┐
│     Next.js App Router       │  ← Pages + API Route Handlers
│  src/app/ + src/app/api/    │
└────────────┬────────────────┘
             │ calls
             ▼
┌─────────────────────────────┐
│        Services Layer        │  ← Business Logic
│   src/server/services/      │
└────────────┬────────────────┘
             │ calls
             ▼
┌─────────────────────────────┐
│      Repositories Layer      │  ← Database Queries (Prisma)
│  src/server/repositories/   │
└────────────┬────────────────┘
             │ calls
             ▼
┌─────────────────────────────┐
│         PostgreSQL           │  ← Persistent Storage
└─────────────────────────────┘

Cross-cutting:
┌─────────────────────────────┐
│           src/lib/           │  ← Shared utilities (prisma client, hashing, response helpers)
│       src/server/validators/ │  ← Zod schemas (used by services + route handlers)
│         src/middleware.ts    │  ← Route protection (runs before everything)
└─────────────────────────────┘
```

---

## Folder Structure

```
securegate/
├── prisma/
│   └── schema.prisma               # DB models: User, VerificationToken, PasswordResetToken
│
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Landing / redirect
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx            # Protected — middleware enforced
│   │   ├── verify-email/
│   │   │   └── [token]/
│   │   │       └── page.tsx
│   │   ├── verify-required/
│   │   │   └── page.tsx
│   │   ├── forgot-password/
│   │   │   └── page.tsx
│   │   ├── reset-password/
│   │   │   └── [token]/
│   │   │       └── page.tsx
│   │   └── api/
│   │       └── auth/
│   │           ├── signup/
│   │           │   └── route.ts
│   │           ├── resend-verification/
│   │           │   └── route.ts
│   │           ├── forgot-password/
│   │           │   └── route.ts
│   │           ├── reset-password/
│   │           │   └── route.ts
│   │           └── [...nextauth]/
│   │               └── route.ts    # NextAuth handler
│   │
│   ├── server/
│   │   ├── services/               # Business logic — one file per domain
│   │   │   ├── auth.service.ts     # signup, login helpers, session logic
│   │   │   ├── token.service.ts    # token generation, validation, deletion
│   │   │   └── email.service.ts    # email dispatch via Resend
│   │   │
│   │   ├── repositories/           # Prisma queries only — no logic
│   │   │   ├── user.repository.ts
│   │   │   ├── verification-token.repository.ts
│   │   │   └── password-reset-token.repository.ts
│   │   │
│   │   └── validators/             # Zod schemas
│   │       ├── signup.schema.ts
│   │       ├── login.schema.ts
│   │       ├── forgot-password.schema.ts
│   │       └── reset-password.schema.ts
│   │
│   ├── lib/
│   │   ├── prisma.ts               # Singleton Prisma client
│   │   ├── hash.ts                 # bcryptjs wrappers (hashPassword, comparePassword)
│   │   ├── response.ts             # API response helpers (success, error)
│   │   ├── rate-limit.ts           # Upstash Redis rate limiter setup
│   │   └── auth-options.ts         # NextAuth configuration (Credentials Provider)
│   │
│   ├── emails/
│   │   ├── VerifyEmail.tsx         # React Email template
│   │   └── ResetPassword.tsx       # React Email template
│   │
│   ├── components/                 # Reusable UI components
│   │   ├── ui/                     # Primitives: Button, Input, Label, etc.
│   │   └── forms/                  # Form-specific: PasswordStrengthIndicator, etc.
│   │
│   └── middleware.ts               # Route guard — runs on every request to /dashboard
│
├── .env.local                      # Local secrets — NEVER commit
├── next.config.js                  # Security headers configured here
├── README.md
└── REFLECTION.md
```

---

## Layer Responsibilities

### `src/app/api/` — Route Handlers
- Parse and validate incoming request body (using Zod schemas).
- Call the appropriate service function.
- Return standardised API response (`{ success, message, data }`).
- **Must not** contain business logic or Prisma calls directly.

### `src/server/services/` — Business Logic
- Orchestrate the auth flows (e.g., hash password → create user → generate token → send email).
- Handle all decisions (token expiry checks, duplicate email checks, etc.).
- Call repositories for all DB operations.
- Call email service for all email operations.
- **Must not** call Prisma directly.

### `src/server/repositories/` — Data Access
- All Prisma queries live here and nowhere else.
- Functions are named clearly: `findUserByEmail`, `createUser`, `deleteVerificationToken`, etc.
- **Must not** contain business logic.

### `src/server/validators/` — Validation Schemas
- Zod schemas for each form/endpoint.
- Shared between route handlers (server) and client components.

### `src/lib/` — Shared Utilities
- `prisma.ts`: single Prisma client instance (prevents connection pooling issues in dev).
- `hash.ts`: wraps bcryptjs so the salt round constant (12) is defined once.
- `response.ts`: helper functions that produce the standard API response shape.
- `rate-limit.ts`: Upstash Redis limiter factory.
- `auth-options.ts`: full NextAuth config including `authorize()` logic.

### `src/middleware.ts` — Route Guard
- Intercepts every request to `/dashboard`.
- Checks session state (JWT/session token).
- Enforces: no session → `/login`, unverified → `/verify-required`, verified → pass through.
- This is the **only** acceptable place for route-level access control.

---

## Data Flow: Signup (Example)

```
1. User fills /signup form
2. Client-side Zod validation (instant feedback)
3. POST /api/auth/signup
4. Route handler: parse body → run Zod server-side validation
5. auth.service.ts: checkDuplicateEmail → hashPassword → createUser → generateToken → sendVerificationEmail
6. user.repository.ts: findUserByEmail, createUser
7. token.service.ts: generateToken, storeVerificationToken
8. email.service.ts: render VerifyEmail.tsx, send via Resend
9. Route handler: return { success: true, message: "..." }
10. Client: show success state
```

---

## Authentication Architecture (NextAuth)

- **Provider**: Credentials only. No OAuth in MVP.
- **Session strategy**: JWT (stateless, stored in httpOnly cookie).
- **`authorize()` function** lives in `src/lib/auth-options.ts`:
  - Fetch user by email via repository.
  - Compare password with `bcryptjs.compare`.
  - On any failure → throw identical generic error (no info leakage).
  - Return user object on success.
- **Session callback**: extend JWT to include `emailVerified` field so middleware can read it.

---

## Rate Limiting Architecture

- Implemented via Upstash Redis (serverless-compatible).
- Applied as middleware/wrapper at the **route handler level**.
- Limits: 5 requests / IP / 10 minutes on `/api/auth/login` (via NextAuth) and `/api/auth/forgot-password`.
- Exceeding limit → HTTP 429, generic message.

---

## Security Header Configuration (`next.config.js`)

```js
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

module.exports = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};
```

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | NextAuth JWT signing secret |
| `NEXTAUTH_URL` | App base URL |
| `RESEND_API_KEY` | Resend email API key |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis auth token |

All variables must be set in `.env.local` (local) and the Vercel dashboard (production). Never commit `.env.local`.