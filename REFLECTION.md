# Security Reflection — SecureGate Assessment

This document contains fifteen foundational security and architectural reflection questions for the **SecureGate MVP v1.0** implementation. Please provide your answers in the designated placeholders below.

---

### Q1: Case-Insensitivity Prevention
How does case-insensitivity of email addresses prevent duplicate account registrations and user confusion under the hood?
* **Answer:** [Insert Answer Here]

---

### Q2: Authentication Error Masking
What threat is mitigated by using identical error messages for failed email and password logins?
* **Answer:** [Insert Answer Here]

---

### Q3: Single-Use Tokens
Why are password reset and email verification tokens deleted immediately after successful consumption in the database?
* **Answer:** [Insert Answer Here]

---

### Q4: Entropy and Cryptographic Tokens
What is the security purpose of using cryptographically secure random bytes (`crypto.randomBytes(32)`) instead of standard sequential IDs or standard UUIDs for tokens?
* **Answer:** [Insert Answer Here]

---

### Q5: Server-Side Middleware Guards
How does the server-side middleware protect access control compared to client-side session checks?
* **Answer:** [Insert Answer Here]

---

### Q6: Layered Architecture Concerns
What is the architectural role of having separate route handlers (`src/app/api`), service files (`src/server/services`), and database repositories (`src/server/repositories`)?
* **Answer:** [Insert Answer Here]

---

### Q7: Repository Layer Isolation
Why must all database calls run strictly within the repository layer rather than leaking inline to API handlers or business services?
* **Answer:** [Insert Answer Here]

---

### Q8: Sliding Window Rate Limiting
How does the sliding window rate limiting strategy using Upstash Redis defend against login brute forcing and resource exhaustion?
* **Answer:** [Insert Answer Here]

---

### Q9: Clickjacking and Content Security Policies
What security header blocks clickjacking, and how does configuring it in `next.config.mjs` ensure site-wide enforcement?
* **Answer:** [Insert Answer Here]

---

### Q10: Generic Error Envelopes
Why must all errors be caught at the service layer and logged server-side, returning only safe, generic envelopes from route handlers?
* **Answer:** [Insert Answer Here]

---

### Q11: Password Hash Cost Factors
Why are password salt cost factors set to exactly 12 rounds rather than higher or lower integers?
* **Answer:** [Insert Answer Here]

---

### Q12: Transactional Dev Fallbacks
How are verification emails generated locally during development without a live Resend API credential?
* **Answer:** [Insert Answer Here]

---

### Q13: Database Normalization Timing
Why is email case-normalization executed before database lookup queries rather than strictly at client-side input validations?
* **Answer:** [Insert Answer Here]

---

### Q14: Stateless JWT Cookies
How does the stateless JWT cookie setup in NextAuth prevent session hijacking?
* **Answer:** [Insert Answer Here]

---

### Q15: Strict-Transport-Security (HSTS)
What is the security implication of setting Strict-Transport-Security (HSTS) headers with max-age preload settings?
* **Answer:** [Insert Answer Here]
