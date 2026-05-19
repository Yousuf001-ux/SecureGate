# SecureGate — Reflection & Engineering Analysis

**Name:** Yusuf Oluwatobi Awokunle
**Cohort:** Design to MVP Bootcamp
**Live URL:** https://secure-gate-two.vercel.app/
**GitHub Repo:** https://github.com/Yousuf001-ux/SecureGate

---

## Part 1 — What I Built

SecureGate is a hardened authentication web application built with Next.js 14 that handles the full user lifecycle — signup, email verification, login, password resets, and session management — all enforced server-side. The core features are a password-based credentials system with bcryptjs hashing (12 rounds), email verification via Nodemailer with a console fallback for local dev, sliding window rate limiting through Upstash Redis, and server-side middleware that blocks unauthenticated or unverified users from protected routes before any page content renders.

## Part 2 — What Surprised Me

The hardest part was getting Resend to work correctly, as it involves several steps from getting an api key to seting up the domain and verifing it, then to finally get it to send emails to the user's email address. It was taking too much time and i had to switch to Nodemailer to complete the assignment. But overall it was a great learning experience and i would definitely recommend it to others as it is a great way to learn about authentication and security.

## Part 3 — Engineering Laws Quiz

### Q1 — Murphy's Law
*"Anything that can go wrong, will go wrong."*

**Code reference:** `src/server/services/email.service.ts` lines 33-39

**My Answer:** When SMTP credentials aren't configured, the email service silently falls back to logging the full verification or reset link to the console. This honors Murphy's Law by planning for the failure before it happens. Instead of crashing with a connection refused error, the app keeps working so you can test the full auth flow locally without a real email server.

**What goes wrong if ignored:** If you don't handle the "no email credentials" case, the entire signup flow breaks on local dev. A new developer clones the repo, runs the app, tries to sign up, and gets a cryptic SMTP connection error with no way to proceed. They'd waste hours debugging email config when all they really wanted was to test the auth flow.

---

### Q2 — Law of Leaky Abstractions
*"All non-trivial abstractions leak to some degree."*

**Code reference:** `src/server/services/user.service.ts` lines 12-13 (`normalizedEmail = email.toLowerCase().trim()`) called from `src/app/api/auth/signup/route.ts` line 26

**My Answer:** Prisma's `findUnique` and `create` abstractions look clean and simple, but they leak the fact that PostgreSQL string comparison is case-sensitive by default. If you don't normalize the email to lowercase in the service layer before passing it to the repository, two users can sign up with "John@Example.com" and "john@example.com" and the unique constraint won't catch it because "John" and "john" are different bytes. The abstraction made me think the DB "just handles it," but the leak forces you to add explicit normalization at every entry point.

**What goes wrong if ignored:** Duplicate accounts silently pile up. You end up with three versions of the same person in your database, password resets go to the wrong address, and support tickets multiply. The root cause is invisible because at first glance everything seems to work.

---

### Q3 — Postel's Law (Robustness Principle)
*"Be conservative in what you send, be liberal in what you accept."*

**Code reference:** `src/server/repositories/user.repo.ts` lines 7-11

**My Answer:** The repository normalizes the email to lowercase right before every database query — `findUnique({ where: { email: email.toLowerCase() } })`. This is Postel's Law applied to authentication: be conservative in what you store (always lowercase, always trimmed) and liberal in what you accept from the user (let them type "John@Example.COM" or "JOHN@EXAMPLE.com" — it all works). The liberal acceptance happens seamlessly because the server handles the normalization, not the client.

**What goes wrong if ignored:** A user signs up with "John.Doe@Example.com" and a month later tries to log in with "john.doe@example.com" login fails. They assume the app is broken or their account was deleted. Support requests skyrocket over something that should never have been a problem in the first place.

---

### Q4 — Kerckhoffs's Principle
*"A cryptosystem should be secure even if everything about the system is public, except the key."*

**Code reference:** `src/server/auth/nextauth.ts` lines 40-50

**My Answer:** The login flow throws the exact same `"Invalid credentials"` error whether the email doesn't exist or the password is wrong. This embodies Kerckhoffs's Principle. the system's security doesn't rely on an attacker not knowing which accounts exist. Even if someone steals the entire database and knows every email, they still can't log in without the password. The identical error message ensures that the mere existence of an account is never leaked through the authentication API.

**What goes wrong if ignored:** An attacker iterates through 10,000 email addresses. For 9,800 of them, they get "no account found." For 200, they get "wrong password." Now they know exactly which 200 emails are valid users and can target them with phishing, social engineering, or credential stuffing. User enumeration is one of the most common reconnaissance techniques, and a two-line change prevents it entirely.

---

### Q5 — Principle of Least Privilege
*"Every component should only have access to the information and resources necessary for its purpose."*

**Code reference:** `src/server/repositories/token.repo.ts` lines 37-50

**My Answer:** The token repository exposes only exactly what the service layer needs — `findVerificationTokenByToken` and `deleteVerificationToken`. There's no `updateVerificationToken`, no `findAllVerificationTokens`, no bulk delete by email. The repository doesn't even know why it's being called; it just handles the DB operation and returns. This prevents a well-meaning service function from accidentally modifying tokens in ways the architecture didn't intend, like updating an expiry date instead of properly expiring one.

**What goes wrong if ignored:** If the repository exposed a generic `updateVerificationToken` method, some future developer might use it to "extend" a token's expiry instead of forcing a proper resend flow. That token now lives longer than intended. A token that should have died in 15 minutes survives for hours, widening the attack window.

---

### Q6 — Defense in Depth
*"Multiple layers of security ensure that if one fails, another catches the failure."*

**Code reference:** `src/middleware.ts` lines 14-26 (server-side middleware guard running before every `/dashboard` request)

**My Answer:** The middleware checks for a valid session AND a non-null `emailVerified` field on every single request to `/dashboard`. But that's not the only layer — the `authorize` callback in NextAuth validates credentials, the `jwt` callback attaches `emailVerified` to the token, the `session` callback surfaces it to the client, and the rate limiter adds a separate throttling layer in front of login. If the JWT secret gets compromised, an attacker still hasn't bypassed rate limiting. If rate limiting has a bug, the JWT still needs to be valid. Each layer independently enforces security.

**What goes wrong if ignored:** With only a client-side check, a user can open DevTools, set `isLoggedIn: true` in localStorage, and see the dashboard UI. Sure, there's no data to see, but the fact that they reached that URL at all tells them the route exists, the app structure, and potentially the API endpoints the dashboard calls. Leaked surface area is still a breach.

---

### Q7 — Pareto Principle (80/20 Rule)
*"Roughly 80% of effects come from 20% of causes."*

**Code reference:** `src/lib/bcrypt.ts` lines 1-5

**My Answer:** Setting bcrypt salt rounds to exactly 12 is the 20% effort that prevents 80% of password-cracking scenarios. Each round doubles the computation time — 12 rounds gives you about 200-300ms per hash on modern hardware. Going from 0 to 12 rounds eliminates most GPU-based brute-force attacks. Going from 12 to 13 would double your server's auth compute cost for a marginal security gain. The 80/20 insight is that 12 rounds is the sweet spot where you get the vast majority of the security benefit with none of the user-facing slowdown.

**What goes wrong if ignored:** At 8 rounds, the hash completes in ~10ms. An attacker with a modern GPU can try 500+ passwords per second per hash. At 15 rounds, the hash takes ~2 seconds. Your users start tweeting "why is login so slow??" and bouncing. Either way, you lose. Twelve rounds is the compromise that keeps both security teams and users happy.

---

### Q8 — Fail-Safe Defaults
*"The default state should be denial of access."*

**Code reference:** `src/server/services/token.service.ts` lines 47-49

**My Answer:** The `validateAndConsumeVerificationToken` function deletes the verification token BEFORE returning the associated email and marking the user as verified. If the server crashes between the delete and the user update — or if an error is thrown — the token is already gone. This is fail-safe: losing a token because of a crash is annoying, but letting a token survive forever because of a crash is a security vulnerability. The default state for any token should be "consumed."

**What goes wrong if ignored:** If the token is deleted AFTER the user is verified (or not deleted at all), a server error during the "mark as verified" step leaves a valid, unexpired token in the database. An attacker who intercepted the verification link can re-use it even though the user already verified. They get their email verified on someone else's account. With a verification token, that's your entire auth chain compromised.

---

### Q9 — Principle of Complete Mediation
*"Every access to every resource must be checked for authorization."*

**Code reference:** `src/server/repositories/user.repo.ts` lines 7-43 (every single method normalizes email with `.toLowerCase()` independently)

**My Answer:** Every repository method normalizes the email to lowercase before querying — not just `findUserByEmail`, but also `createUser`, `markEmailVerified`, and `updateUserPassword`. This is Complete Mediation applied to data access: no matter which code path reaches the database — signup, login, verification, password reset — the normalization check happens at the gate. You don't assume a higher layer already handled it, because a new route handler or service might skip that normalization step in the future.

**What goes wrong if ignored:** A new developer adds a `deleteAccount` endpoint and calls `userRepo.findUserByEmail("John@Example.com")` directly without normalizing first. The query returns null because the DB stores "john@example.com". The user gets a "account not found" error and can't delete their own account. The user-facing experience breaks, and the root cause traces back to an implicit assumption that upstream code already did the normalization.

---

### Q10 — Weakest Link Principle
*"The security of a system is only as strong as its weakest component."*

**Code reference:** `src/server/services/token.service.ts` line 8 (`crypto.randomBytes(32).toString("hex")`)

**My Answer:** Everything else in the auth chain — bcrypt hashing, rate limiting, middleware guards — gets undermined if the token generation itself is predictable. A sequential ID or timestamp-based token means an attacker who guesses one valid token can trivially guess the next. Using `crypto.randomBytes(32)` (256 bits of entropy from the OS CSPRNG) ensures that token generation is never the weakest link. Even if an attacker knows the exact algorithm and the exact timestamp, they still can't predict the output.

**What goes wrong if ignored:** Using `Math.random()` or a sequential counter for tokens means an attacker can enumerate valid tokens. They sign up, get token 52, then write a script to try tokens 50-100 against the verify-email endpoint. Token 53 might belong to another user. That user's account gets verified without their consent — worse, by an attacker who now controls a verified account under someone else's email.

---

### Q11 — Least Common Mechanism
*"Minimize the amount of shared mechanisms between users to prevent information leaks."*

**Code reference:** `src/app/api/auth/signup/route.ts` lines 34-48

**My Answer:** The signup route handler catches the `"REGISTRATION_FAILED"` error and returns a generic "An account with these details could not be created" message. It doesn't return the Prisma error, the stack trace, or even a distinction between "duplicate email" vs "internal error." This is Least Common Mechanism at work — the same error envelope is used for every failure, so an attacker can't distinguish between different failure modes by observing different outputs. All error paths converge on the same shared mechanism: a generic JSON envelope.

**What goes wrong if ignored:** Returning Prisma's `Unique constraint failed on User.email` gives an attacker a clear signal: the email exists. Now they know that "john@example.com" is a registered user. Combined with the login endpoint's identical error message, they've bypassed one of your security layers just by reading your error response.

---

### Q12 — Separation of Duty
*"No single component should be able to execute a critical operation alone."*

**Code reference:** `src/server/services/user.service.ts` lines 95-106 (`resetPassword` calls token validation, then password update, then token deletion in sequence)

**My Answer:** A password reset requires three separate actors — the token service validates the token, the user service hashes the new password, and the token repo deletes the old token. No single function can do all three. This prevents scenarios like a bug in the user service accidentally deleting verification tokens without actually changing the password, or a compromised repository function changing a password without first validating a reset token. Each responsibility is owned by a different layer.

**What goes wrong if ignored:** If the token validation and password update were in the same function with no separation, a developer could accidentally skip the token check while refactoring. The function would still compile and "work," but now anyone who knows the email can reset the password without any token at all. Separation of duty turns a one-line mistake into a compilation error or a test failure.

---

### Q13 — Secure by Default
*"The system should be secure in its default configuration."*

**Code reference:** `next.config.mjs` lines 24-26 (`Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`)

**My Answer:** The HSTS header with `preload` tells browsers to ONLY connect to the site over HTTPS — forever — even before the user's first visit (if the domain is on the preload list). This is Secure by Default because the decision to use HTTPS is made at the framework level, not left to individual page implementations. There's no opt-in required per route. The browser enforces it before any HTTP request completes, so a man-in-the-middle on the same Wi-Fi network can't even attempt an SSL strip attack — the browser won't let the HTTP request through.

**What goes wrong if ignored:** Without HSTS, the first HTTP request an unvisited user makes to your site travels in plaintext. An attacker on the same coffee shop Wi-Fi intercepts it, responds with a fake page, and the user types their credentials into a phishing clone. HSTS prevents the attack from ever starting — the browser upgrades to HTTPS before the request leaves.

---

### Q14 — Psychological Acceptability
*"Security mechanisms should not make the system difficult to use."*

**Code reference:** `src/server/services/rateLimit.service.ts` lines 11-14 (`Ratelimit.slidingWindow(5, "10 m")`)

**My Answer:** Five attempts per ten minutes per IP with a sliding window is strict enough to block brute-force attacks but lenient enough that a genuine user who mistypes their password four times isn't locked out of their account for an hour. The sliding window (rather than a fixed reset at the top of the hour) also means a user who waits a few minutes can try again — they're not punished by arbitrary clock boundaries. The rate limit is psychologically acceptable because it doesn't make users feel like they're being treated as attackers for making an honest mistake.

**What goes wrong if ignored:** A rate limit of 3 attempts per hour means a user who forgets their password triggers the lockout in seconds. They're stuck, frustrated, and probably blame the app, not their own memory. A rate limit of 100 attempts per minute is so permissive it's useless — a brute-force script burns through thousands of password guesses before the first human even wakes up. Getting this wrong in either direction creates either unusable UX or no security at all.

---

### Q15 — Chesterton's Fence
*"Don't remove a fence until you know why it was put there."*

**Code reference:** `src/app/api/auth/forgot-password/route.ts` lines 37-38 (always returns identical success message)

**My Answer:** The fence here is the "always return success" pattern for forgot-password — the endpoint sends back `"If an account exists for this email, a reset link has been sent."` even when no account exists. A developer unfamiliar with security might look at this and think "that's a bug, it should tell the user if their email isn't registered." But the fence exists to prevent user enumeration. Knowing why it's there before removing it is critical — "fixing" this "bug" by returning different messages for found vs not-found accounts would create a security vulnerability that directly leaks your user database.

**What goes wrong if ignored:** A product manager says "users are confused, let's tell them if their email exists or not." Someone removes the fence without understanding it. The forgot-password endpoint now returns "email found — check your inbox" vs "email not found." An attacker runs a quick script against this endpoint and within minutes has a complete list of every registered email address. That list is now sold, phished, or credential-stuffed. All because a "confusing" response message was "fixed" without understanding what it protected.

---

## Part 4 — One Thing I Would Refactor

The rate limiter defaults to **fail-open** — if Redis is down or unconfigured, it logs a warning and returns `true` (allow). For a security-first app, this should default to **fail-closed** (block until the admin intervenes). A production outage is better than an open door during a Redis failure.

**Refactored version of** `src/server/services/rateLimit.service.ts`:

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

export const rateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "10 m"),
  analytics: false,
  prefix: "@upstash/ratelimit/securegate",
});

export async function checkRateLimit(ip: string, action: string): Promise<boolean> {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.error("[RateLimit] Redis not configured. Denying all requests until configured.");
    return false;
  }

  try {
    const identifier = `${action}:${ip}`;
    const { success } = await rateLimiter.limit(identifier);
    return success;
  } catch (error) {
    console.error(`[RateLimit] Redis error — denying request to prevent security gap.`, error);
    return false;
  }
}
```

This swaps fail-open for fail-closed. In production, if Redis is down, login attempts are blocked until Redis recovers — which is annoying, but it's far better than allowing unlimited login attempts against your database. The tradeoff is intentional and documented.

## Part 5 — How This Changes How I Build

Before this project, I treated authentication as a checkbox feature — slap on NextAuth, add a middleware template from a blog post, and call it done. I now see it differently. Every single decision, from error messages to token deletion order, creates either a hardening or a vulnerability. I'll never look at a "password cannot be empty" validation the same way again. More broadly, I learned that engineering laws like Postel's Principle and Kerckhoffs's Principle aren't abstract theory — they're practical tools you can apply line-by-line. When I'm unsure about a design choice, I now ask "what law or principle does this violate?" instead of "does this feel right?" That shift alone is worth more than any specific auth implementation detail.
