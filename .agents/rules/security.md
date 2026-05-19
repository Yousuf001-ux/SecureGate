---
trigger: always_on
---

# security.md — SecureGate

## Purpose

This document defines every security requirement, decision, and rule for SecureGate. It serves as both a reference during development and a checklist during review. All requirements here are **non-negotiable** for MVP v1.0.

> Security is not a feature to be added. It is the foundation everything is built on.

---

## Threat Model (Summary)

SecureGate protects against the following threat categories:

| Threat | Attack Vector | Mitigation |
|---|---|---|
| Credential theft | Weak/stored plaintext passwords | bcrypt hashing, 12 rounds |
| Brute-force login | Repeated login attempts | Rate limiting (5 / 10 min / IP) |
| Account enumeration | Different error messages | Identical error messages on all auth failures |
| Token replay | Reusing verification/reset tokens | Single-use tokens, deleted on use |
| Token brute-force | Guessing short tokens | 32-byte random tokens (256-bit entropy) |
| Session hijacking | Insecure cookies | NextAuth httpOnly cookie, NEXTAUTH_SECRET |
| Clickjacking | UI rendered in an iframe | `X-Frame-Options: DENY` header |
| MIME sniffing | Browser misinterpreting content | `X-Content-Type-Options: nosniff` |
| Info leakage | Error messages, stack traces | Generic messages, server-side logging only |
| Secret exposure | Committed `.env` files | `.gitignore`, Vercel env vars only |
| Token flooding | Generating unlimited reset tokens | Rate limiting on `/forgot-password` |

---

## 1. Password Security

### Requirements
- **Algorithm**: bcryptjs only. No MD5, SHA-1, SHA-256 alone, or any reversible encoding.
- **Salt rounds**: 12. Defined once as a constant in `src/lib/hash.ts`.
- **Storage**: Only the bcrypt hash is stored in the database. The raw password must never be logged, stored, or returned.
- **Verification**: Use `bcryptjs.compare(inputPassword, storedHash)` — never decrypt.

### Implementation
```ts
// src/lib/hash.ts
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### Verification
A correctly hashed password in the DB will start with `$2b$12$`. This can be verified during QA.

---

## 2. Token Security

Two token types are used: `VerificationToken` and `PasswordResetToken`.

### Generation
```ts
import crypto from "crypto";

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex"); // 64 hex chars, 256-bit entropy
}
```

Never use `Math.random()`, UUIDs, or any predictable sequence for security tokens.

### Expiry
| Token Type | Expiry |
|---|---|
| Email Verification Token | 15 minutes from generation |
| Password Reset Token | 1 hour from generation |

```ts
// Verification token expiry
const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

// Reset token expiry
const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
```

### Validation
On every token use:
1. Query token from DB.
2. If not found → reject (treat as invalid).
3. If `expires < new Date()` → reject (treat as expired).
4. If valid → proceed, then **immediately delete the token**.

```ts
if (!token) throw new Error("TOKEN_INVALID");
if (token.expires < new Date()) throw new Error("TOKEN_EXPIRED");
// ... do the thing
await deleteToken(token.id); // Delete BEFORE returning success
```

### One-Time Use
Tokens must be deleted from the database immediately after successful use. A token that has been used once must never be usable again. There is no "deactivated" state — deleted means deleted.

---

## 3. Error Messaging & Information Leakage Prevention

### The Core Rule
**Never reveal information that helps an attacker.**

Specifically:
- Never confirm whether an email address exists in the database.
- Never indicate whether a password was wrong vs. the email being wrong.
- Never return stack traces, Prisma errors, or internal error details.
- Never expose the token value in any response beyond the email link.

### Login Errors
All of the following must return the **identical** message:
- Email not found
- Email found, password wrong
- Email found, password correct, account not verified (redirect, not error)

```ts
// ✅ Correct — same message regardless of failure reason
throw new Error("Invalid credentials");

// ❌ Wrong — reveals which field failed
throw new Error("No account found with that email");
throw new Error("Incorrect password");
```

### Forgot Password
Always respond with the same message, regardless of whether the email exists:

```
"If an account exists for this email, a reset link has been sent."
```

Never return an error if the email isn't found. The internal logic branches, but the external response does not.

### API Error Format
```ts
// ✅ Safe — generic message
return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 });

// ❌ Unsafe — leaks internals
return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
```

### Server-Side Logging
Full errors **are** logged server-side with route context. This is intentional — debugging requires visibility. The distinction is that logs are server-only, never sent to the client.

```ts
console.error("[POST /api/auth/signup] Unexpected error:", error);
```

---

## 4. Rate Limiting

### Protected Endpoints
| Endpoint | Limit | Window | Response |
|---|---|---|---|
| `POST /api/auth/[...nextauth]` (login) | 5 attempts | 10 minutes per IP | HTTP 429 |
| `POST /api/auth/forgot-password` | 5 attempts | 10 minutes per IP | HTTP 429 |

### Implementation (Upstash Redis)
```ts
// src/lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const loginRateLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "10 m"),
  analytics: false,
});
```

### Response on Limit Exceeded
```ts
const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
const { success } = await loginRateLimiter.limit(ip);

if (!success) {
  return errorResponse("Too many attempts. Please try again later.", 429);
}
```

The error message must not reveal the exact limit or window size.

---

## 5. Session Security

- **Provider**: NextAuth.js Credentials Provider only.
- **Strategy**: JWT stored in an `httpOnly` cookie (NextAuth default).
- **Secret**: `NEXTAUTH_SECRET` must be a cryptographically random string of at least 32 characters. Set in environment variables only.
- **Session data**: Only safe, non-sensitive fields are stored in the JWT payload (user ID, emailVerified status). Never store passwords, raw tokens, or PII beyond what's needed.
- **Session destruction on logout**: Call NextAuth `signOut()` — do not attempt to manually clear cookies.

---

## 6. Middleware & Route Protection

`src/middleware.ts` is the authoritative access control layer.

### Rules
| Condition | Action |
|---|---|
| No session | Redirect to `/login` |
| Session exists, `emailVerified` is null | Redirect to `/verify-required` |
| Session exists, `emailVerified` is set | Allow access |

### Critical Constraints
- Middleware runs server-side. **Client-side checks are not a substitute.**
- Never implement access control via `useSession()` on the dashboard page. Middleware handles it.
- The `emailVerified` field must be included in the JWT callback so middleware can read it without a DB call.

```ts
// src/lib/auth-options.ts — JWT callback
callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.emailVerified = user.emailVerified;
    }
    return token;
  },
  async session({ session, token }) {
    session.user.emailVerified = token.emailVerified as Date | null;
    return session;
  },
}
```

---

## 7. Security Headers

Set in `next.config.js`. Applied to all routes via `source: "/(.*)"`.

```js
const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "DENY",
    // Prevents the app from being embedded in an iframe (clickjacking protection)
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
    // Prevents browser from guessing content type (MIME sniffing attacks)
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
    // Limits referrer info sent to external sites
  },
];
```

---

## 8. Environment & Secret Management

### Rules
- **Never** commit `.env.local` to version control. It must be in `.gitignore`.
- **Never** hardcode secrets, API keys, or connection strings in source files.
- All secrets are accessed via `process.env.VARIABLE_NAME`.
- Production secrets live in Vercel environment variables only.

### Required Environment Variables
| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random 32+ char secret for JWT signing |
| `NEXTAUTH_URL` | Full base URL of the deployed app |
| `RESEND_API_KEY` | API key from Resend dashboard |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis endpoint URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis auth token |

### Generating a Secure `NEXTAUTH_SECRET`
```bash
openssl rand -base64 32
```

---

## 9. Input Validation

- All user inputs are validated **server-side** using Zod before any business logic executes.
- Client-side validation is additive (UX only) — it is never the sole line of defence.
- Validation rejects unexpected fields (use `z.object().strict()` where appropriate).
- Emails are normalised to lowercase before DB lookup to prevent case-based duplicates.

---

## 10. Security QA Checklist

Before shipping, verify every item:

### Password Security
- [ ] All passwords in DB begin with `$2b$12$` (bcrypt, 12 rounds)
- [ ] No plaintext passwords appear in logs, responses, or DB records

### Token Security
- [ ] Verification tokens expire after 15 minutes
- [ ] Reset tokens expire after 1 hour
- [ ] Expired tokens cannot verify or reset
- [ ] Used tokens are deleted from DB immediately
- [ ] Tokens cannot be reused after deletion

### Error Messaging
- [ ] Wrong email and wrong password produce identical login error
- [ ] Forgot password always returns success regardless of email existence
- [ ] No endpoint returns stack traces or Prisma error details

### Rate Limiting
- [ ] Login blocks after 5 failed attempts (per IP, 10-minute window)
- [ ] Forgot password blocks after 5 attempts (per IP, 10-minute window)
- [ ] Blocked requests return HTTP 429

### Route Protection
- [ ] `/dashboard` is inaccessible without a valid session
- [ ] `/dashboard` is inaccessible with a valid but unverified session
- [ ] Middleware redirects are server-side (not client-side)

### Environment
- [ ] `.env.local` is in `.gitignore` and not committed
- [ ] No secrets appear in committed source code
- [ ] All required environment variables are set in Vercel

### Headers
- [ ] `X-Frame-Options: DENY` is present on all responses
- [ ] `X-Content-Type-Options: nosniff` is present on all responses
- [ ] `Referrer-Policy: strict-origin-when-cross-origin` is present on all responses