# SecureGate — Reflection & Engineering Analysis

**Name:** Yusuf Oluwatobi Awokunle
**Cohort:** Design to MVP Bootcamp
**Live URL:** https://secure-gate-two.vercel.app/
**GitHub Repo:** https://github.com/Yousuf001-ux/SecureGate

---

## Part 1 — What I Built

SecureGate is a login and signup app that keeps user accounts safe. It lets people create accounts, verify their email, log in, and reset their password. It uses bcrypt to protect passwords, rate limiting to stop attackers, and server-side middleware to block unverified users from the dashboard.

## Part 2 — What Surprised Me

The hardest part was getting the middleware to work with NextAuth. When a user logs in, the session cookie does not get set right away. I had to learn how NextAuth creates and reads JWTs under the hood to make the middleware wait for the cookie before checking access.

## Part 3 — Engineering Laws Quiz

### Q1 — Murphy's Law
*"Anything that can go wrong will go wrong."*

**Code reference:** `src/server/services/rateLimit.service.ts` lines 11-14

**My Answer:** I added rate limiting so attackers cannot keep guessing passwords. I also made the email service print links to the terminal when email is not set up, so the app still works in development.

**What goes wrong if ignored:** Attackers try thousands of passwords or the app crashes for new developers with no email configured.

---

### Q2 — Law of Leaky Abstractions
*"All non-trivial abstractions leak to some degree."*

**Code reference:** `src/server/repositories/user.repo.ts` lines 7-11

**My Answer:** Prisma hides that PostgreSQL treats "John@email.com" and "john@email.com" as different emails. I had to add .toLowerCase() to fix this.

**What goes wrong if ignored:** Users create multiple accounts by accident just by typing their email in different capital letters.

---

### Q3 — YAGNI
*"You Aren't Gonna Need It."*

**Code reference:** `src/server/auth/nextauth.ts` lines 7-91

**My Answer:** Social login, MFA, and audit logs sound cool but I do not need them yet. I only built what the project asked for. I can add them later if someone asks.

**What goes wrong if ignored:** I waste time building features nobody asked for and my login might still have bugs.

---
 
### Q4 — Kerckhoffs's Principle
*"Security must not rely on the secrecy of the algorithm."*

**Code reference:** `src/lib/bcrypt.ts` lines 1-8

**My Answer:** A salt is random text added to your password before hashing so two users with the same password get different hashes. bcrypt does this by itself. SHA-256 is too fast and has no salt, so attackers can crack passwords quickly.

**What goes wrong if ignored:** If the database is stolen, attackers crack the passwords in hours instead of years.

---

### Q5 — Postel's Law + Security by Design
*"Be conservative in what you send."*

**Code reference:** `src/app/api/auth/forgot-password/route.ts` lines 37-38

**My Answer:** The forgot-password endpoint always says "email sent" even if the email does not exist. This stops attackers from finding out which emails are registered.

**What goes wrong if ignored:** Attackers find all valid emails and send phishing attacks to those users.

---

### Q6 — The Boy Scout Rule
*"Leave the code better than you found it."*

**Code reference:** `src/app/api/auth/resend-verification/route.ts` line 2

**My Answer:** The resend-verification file was importing a schema called "forgotPasswordSchema" which was confusing. I renamed it so the code makes sense.

**What goes wrong if ignored:** Developers copy the wrong import because the name is misleading.

---

### Q7 — Gall's Law
*"A complex system that works evolved from a simple system that worked."*

**Code reference:** `src/middleware.ts` lines 9-54

**My Answer:** I built one feature at a time. First signup, then login, then middleware, then password reset. Each step worked before I added the next one.

**What goes wrong if ignored:** I build everything at once, it breaks, and I have no idea where the bug is.

---

### Q8 — Law of Leaky Abstractions (ORMs)
*"All non-trivial abstractions leak."*

**Code reference:** `prisma/schema.prisma` lines 19-33

**My Answer:** The VerificationToken table uses two columns as its ID, not a single ID column. Prisma hides this from you.

**What goes wrong if ignored:** Someone writes a raw SQL query that fails because they did not know about the composite key.

---

### Q9 — Zawinski's Law
*"Every program attempts to expand until it can read mail."*

**Code reference:** `src/server/services/rateLimit.service.ts` lines 1-47

**My Answer:** I had to add rate limiting because NextAuth does not include it. Zawinski's Law says apps try to do everything over time. You must stay focused on what the app is for.

**What goes wrong if ignored:** The app keeps growing with random features until it is slow and messy.

---

### Q10 — Principle of Least Surprise
*"Software should behave in the way users expect."*

**Code reference:** `src/app/(pages)/login/page.tsx` lines 41-45

**My Answer:** The login form shows "Invalid email or password" for both wrong email and wrong password. Users expect a simple message, not a detailed breakdown of what they got wrong.

**What goes wrong if ignored:** Telling users "email not found" lets attackers know which emails are real.

---

### Q11 — Murphy's Law + Defensive Programming
*"Assume the worst-case user."*

**Code reference:** `src/middleware.ts` lines 9-54

**My Answer:** The middleware reads the JWT from the cookie. If a user deletes their cookie, the middleware sends them straight to /login before the dashboard loads.

**What goes wrong if ignored:** Users see a flash of the dashboard before the login check runs.

---

### Q12 — Kerckhoffs's Principle + Technical Debt
*"Security debt has compounding interest."*

**Code reference:** `src/server/auth/nextauth.ts` line 90

**My Answer:** If NEXTAUTH_SECRET gets pushed to GitHub, anyone can create fake login cookies and access protected pages. You fix it by generating a new secret and deploying it. Old commits still have the secret in the history.

**What goes wrong if ignored:** Attackers keep accessing accounts even after you think the problem is fixed.

---

### Q13 — Conway's Law
*"Systems mirror the communication structure of the people who build them."*

**Code reference:** The folder structure: `src/app/api/` -> `src/server/services/` -> `src/server/repositories/`

**My Answer:** My folder structure shows how I think. Routes handle requests, services run the logic, and repositories talk to the database. Each folder has one job.

**What goes wrong if ignored:** Without clear folders, code gets thrown anywhere and becomes hard to find.

---

### Q14 — Technical Debt
*"Everything that slows you down later because of a shortcut taken now."*

**Code reference:** `src/server/services/rateLimit.service.ts` lines 35-46

**My Answer:** The rate limiter lets all requests through when Redis is down. I left it this way so the app works without Redis during development. The fix is to block requests when Redis fails.

**What goes wrong if ignored:** If Redis goes down in production, attackers can guess passwords with no limits.

---

### Q15 — Synthesis
*"All principles apply."*

**Answer:** Every principle still applies when adding payments. Murphy's Law matters most because payments fail, webhooks time out, and charges duplicate. Fail-Safe Defaults means never giving access until payment is confirmed by the server. Never trust what the browser tells you.

---

## Part 4 — One Thing I Would Refactor

The rate limiter lets all requests through when Redis is down. I would change it to block requests when Redis is down, because letting unlimited logins through is worse than a temporary outage.

Refactored code in `src/server/services/rateLimit.service.ts`:

```typescript
export async function checkRateLimit(ip: string, action: string): Promise<boolean> {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.error("[RateLimit] Redis not configured. Denying all requests.");
    return false;
  }
  try {
    const identifier = `${action}:${ip}`;
    const { success } = await rateLimiter.limit(identifier);
    return success;
  } catch (error) {
    console.error("[RateLimit] Redis error. Denying request.", error);
    return false;
  }
}
```

## Part 5 — How This Changes How I Build

Before this project, I thought auth was just adding a library and moving on. Now I know that every small decision, from error messages to token expiry, matters for security. I also learned to ask "what principle does this break?" instead of just guessing if something is right.
