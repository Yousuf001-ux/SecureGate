# SecureGate 🛡️

SecureGate is a **hardened, production-grade authentication and security application** built with Next.js 14 App Router, TypeScript, NextAuth.js, and Prisma.

Every design, architectural, and coding choice is engineered through a defensive security lens to block common vulnerabilities like clickjacking, credential stuffing, enumeration, and token reuse.

---

## 🏗️ Layered Architecture

SecureGate maintains a strict separation of concerns utilizing a layered server-first directory mapping:

```
src/
├── app/                    # Next.js App Router (Pages & Endpoint Envelopes)
│   ├── api/                # Route Handlers (strictly parses body & Zod validation)
│   └── (pages)/            # Client & Server Page Views (signup, login, dashboard)
├── server/
│   ├── services/           # Business Logic (signup orchestration, token handling, emails)
│   ├── repositories/       # Database Layer (strictly Prisma queries only)
│   └── validators/         # Zod schemas (shared validation models)
├── lib/                    # Core Singletons (hashing, prisma client, response structures)
├── emails/                 # React Email transactional layouts
└── components/             # Reusable accessible atomic UI blocks
```

---

## 🔒 Security Specifications

SecureGate enforces the following security standards:

1. **Hardened Hashing**: Strictly hashes passwords using `bcryptjs` with exactly **12 cost rounds** (`$2b$`).
2. **256-bit Tokens**: Verification and reset tokens are generated using cryptographically secure random bytes (`crypto.randomBytes(32)`).
3. **Instant Expiries**: Verification links expire in **15 minutes**; Reset links expire in **1 hour**.
4. **Single-Use Tokens**: Every token is instantly consumed and deleted from the database upon first use to completely block replay attacks.
5. **Anti-Enumeration Masking**: Failed credentials and non-existent accounts produce identical generic responses. Forgot-password always resolves with generic success.
6. **Sliding-Window Rate Limiting**: NextAuth and Forgot-password endpoints limit IP requests to **5 attempts / 10 minutes** using Upstash Redis.
7. **Severe HTTP Headers**: Site-wide Content Security Policy (CSP), Frame Options (DENY), HSTS, and nosniff rules are enforced.

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` or `.env.local` to start.

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/securegate` |
| `NEXTAUTH_URL` | Application root URL | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | 256-bit cryptographically secure string | `hP6N9R7kS2vT5wY8zA1bC4dE7fG0hJ3kM6nP9qR2` |
| `RESEND_API_KEY` | Transactional email dispatch key | `re_1234567890` (Console falls back if missing) |
| `UPSTASH_REDIS_REST_URL` | Rate limit storage endpoint | `https://upstash-example.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | Rate limit token | `Ap_exampleToken` |

> [!NOTE]
> **Zero Resend Fallback**: If `RESEND_API_KEY` is not present, SecureGate runs in **Developer Console Mode** where email verification and password reset URLs are directly output to the Node console for instant local click-testing!

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Database & Migrations
Create your database and compile the Prisma client:
```bash
npx prisma generate
npx prisma db push
```

### 3. Start Local Development
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view SecureGate.
