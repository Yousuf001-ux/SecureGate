# AGENTS.md — SecureGate

> This file is the single source of truth for any AI agent (Claude, Copilot, Cursor, etc.) working on the SecureGate codebase. Read it fully before touching any file. Also consult `.agents/rules/` for detailed architecture, code-style, design-system, and security guidelines, and `.agents/skills/` for task-specific skill workflows.

---

## 1. Project Identity

| Field | Value |
|---|---|
| Product | SecureGate |
| Type | Standalone Authentication & Security Web App |
| Version | MVP v1.0 |
| Owner | Yusuf Awokunle |
| Platform | Web — Desktop + Mobile Responsive |

SecureGate is a **hardened authentication layer** — not a general-purpose app. Every decision must be evaluated through the lens of security correctness first, then UX, then DX.

---

## 2. Tech Stack (Non-Negotiable)

Do not suggest, install, or use alternatives to these without explicit approval.

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | NextAuth.js — Credentials Provider only |
| Password Hashing | bcryptjs — 12 salt rounds |
| Validation | Zod (server-side and client-side) |
| Email | Resend + React Email templates |
| Rate Limiting | Upstash Redis |
| Styling | TailwindCSS |
| Deployment | Vercel |

---

## 3. Codebase Map

Always respect these boundaries. Do not flatten or reorganize the folder structure.

```
src/
├── app/                    # Pages + Next.js routes (App Router)
│   ├── api/                # Route handlers only — no business logic here
│   └── (pages)/            # UI pages
├── server/
│   ├── services/           # Business logic (auth flows, token generation, email dispatch)
│   ├── repositories/       # All Prisma DB queries — no raw SQL elsewhere
│   └── validators/         # Zod schemas
├── lib/                    # Shared utilities: prisma client, response helpers, hashing
├── emails/                 # React Email templates
│   ├── VerifyEmail.tsx
│   └── ResetPassword.tsx
├── components/             # Reusable UI components only
└── middleware.ts           # Route protection — edit with extreme care
```

**Rules:**
- Route handlers in `src/app/api` must call services, not repositories directly.
- Repositories are the only place Prisma queries live.
- Middleware must never be bypassed by client-side checks.

---

## 4. Auth Flows — Full Specification

### 4.1 Signup (`POST /api/auth/signup` → `/signup`)
1. Validate `name`, `email`, `password` with Zod (server + client).
2. Check for duplicate email — return generic error if taken (do not reveal it's taken).
3. Hash password: `bcryptjs.hash(password, 12)`.
4. Create user: `emailVerified = null`.
5. Generate verification token: `crypto.randomBytes(32).toString("hex")`.
6. Store token in `VerificationToken` table with 15-minute expiry.
7. Send verification email via Resend using `VerifyEmail.tsx` template.

### 4.2 Email Verification (`GET /verify-email/[token]`)
1. Look up token in DB.
2. If missing or expired → show error UI + resend option.
3. If valid → set `emailVerified = DateTime.now()`, delete token, show success UI with "Go to Login".

### 4.3 Login (`/login` → NextAuth Credentials)
1. Fetch user by email.
2. Compare password with `bcryptjs.compare`.
3. On any failure (wrong email OR wrong password) → return identical generic error message.
4. On success → create NextAuth session.
5. Rate limit: 5 attempts / IP / 10 minutes → HTTP 429 on breach.

### 4.4 Dashboard (`/dashboard`)
- Protected server-side via middleware.
- No session → redirect `/login`.
- Session but `emailVerified = null` → redirect `/verify-required`.
- Session + verified → access granted.

### 4.5 Verify Required (`/verify-required`)
- Shows "please verify your email" message.
- "Resend Verification Email" button → triggers resend flow.
- Logout button.

### 4.6 Forgot Password (`POST /api/auth/forgot-password` → `/forgot-password`)
1. Accept email input.
2. Always return: `"If an account exists, a reset email has been sent."` — regardless of whether email exists.
3. If email exists in DB: generate reset token, store with 1-hour expiry, send via Resend.
4. Rate limit: 5 attempts / IP / 10 minutes → HTTP 429.

### 4.7 Reset Password (`POST /api/auth/reset-password` → `/reset-password/[token]`)
1. Validate token exists and is not expired.
2. Accept new password.
3. Hash with bcryptjs (12 rounds).
4. Update user's password in DB.
5. Delete token (one-time use).
6. Show success message, redirect to `/login`.

### 4.8 Logout
1. Call NextAuth `signOut()`.
2. Destroy session completely.
3. Redirect to `/login`.

---

## 5. API Contract

All API routes must return this exact shape:

```ts
// Success
{ "success": true, "message": "...", "data": {} }

// Error
{ "success": false, "message": "..." }
```

**Never** return stack traces, Prisma errors, or internal messages in API responses.

### API Routes
| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/resend-verification` | Resend verification email |
| POST | `/api/auth/forgot-password` | Trigger password reset email |
| POST | `/api/auth/reset-password` | Apply new password via token |
| ANY | `/api/auth/[...nextauth]` | NextAuth handler |

### Pages
| Route | Purpose |
|---|---|
| `/login` | Login form |
| `/signup` | Registration form |
| `/dashboard` | Protected home (verified only) |
| `/verify-email/[token]` | Email verification handler |
| `/verify-required` | Prompt to verify email |
| `/forgot-password` | Request password reset |
| `/reset-password/[token]` | Set new password |

---

## 6. Database Models

### User
```prisma
model User {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  password      String
  emailVerified DateTime?
  createdAt     DateTime  @default(now())
}
```

### VerificationToken
```prisma
model VerificationToken {
  identifier String   // email
  token      String   @unique
  expires    DateTime
}
```

### PasswordResetToken
```prisma
model PasswordResetToken {
  email   String
  token   String   @unique
  expires DateTime
}
```

---

## 7. Security Rules (Absolute — Never Violate)

These are not suggestions. Violating any of these is a blocker.

1. **Passwords**: bcryptjs only, 12 salt rounds, no plaintext ever stored or logged.
2. **Tokens**: `crypto.randomBytes(32).toString("hex")` only. Always set expiry. Always delete after use.
3. **Error messages**: Never reveal whether an email exists. Never reveal whether a password was wrong. Use identical generic messages.
4. **Rate limiting**: Login and forgot-password endpoints — 5 attempts / IP / 10 min. Return HTTP 429 on breach.
5. **Stack traces**: Never return in API responses. Log server-side only.
6. **Secrets**: Never hardcode. Never commit `.env.local`. All secrets via environment variables.
7. **Security headers** (set in `next.config.js`):
   - `X-Frame-Options: DENY`
   - `X-Content-Type-Options: nosniff`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Content-Security-Policy: default-src 'self'`
   - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
8. **Middleware**: Route protection must run server-side. Never rely on client-side session checks for access control.

---

## 8. What Is Explicitly Out of Scope

Do not implement, suggest, or scaffold any of the following:

- Social login (Google, GitHub, etc.)
- MFA / 2FA
- Audit logs
- Role-based access control (RBAC)
- Admin dashboard
- Payment integration
- Profile editing
- User settings pages

If a user request touches any of these, flag it as out of scope for MVP v1.0.

---

## 9. Agent Behaviour Rules

### Before Writing Code
- Confirm which layer you are working in (route handler, service, repository, component).
- Confirm the security implications of any new endpoint or logic.
- Never write business logic inside a route handler — delegate to `src/server/services/`.
- Never write DB queries outside `src/server/repositories/`.

### When Modifying Middleware
- Treat `src/middleware.ts` as critical infrastructure.
- Any change must preserve all three protection rules: unauthenticated → `/login`, unverified → `/verify-required`, verified → allow.
- Do not add client-side fallbacks as a substitute for middleware checks.

### When Handling Errors
- Catch all errors at the service layer.
- Return only safe, generic messages from API routes.
- Log the full error server-side (console.error or logger).

### When Writing Emails
- Use React Email templates in `src/emails/`.
- Always include the token expiry warning in email copy.
- Always include a clear CTA button/link.
- Subject lines are fixed — **Verify Email**: `"Verify your email for SecureGate"`, **Reset Password**: `"Reset your SecureGate password"`.

### Environment Variables
- Never hardcode any secret, key, or connection string.
- All secrets must be referenced via `process.env.VARIABLE_NAME`.
- Document every new variable in `README.md`.
- Maintain a `.env.example` at project root listing all required variables with placeholder values (no secrets).

---

## 10. Definition of Done (Agent Checklist)

Before marking any task complete, verify:

- [ ] All auth flows work end-to-end
- [ ] Passwords stored as bcrypt hashes (`$2b$` prefix)
- [ ] Tokens are single-use and expire correctly
- [ ] No endpoint reveals email existence
- [ ] Rate limiting active on login + forgot-password
- [ ] Dashboard inaccessible without auth and verification
- [ ] No secrets in source code or committed files
- [ ] API responses follow standard format
- [ ] Security headers configured in `next.config.js`
- [ ] `README.md` and `REFLECTION.md` exist and are complete