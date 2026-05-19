---
trigger: always_on
---

# code-style.md — SecureGate

## Philosophy

SecureGate code should be **readable, predictable, and boring in the best way**. Clever tricks are a liability in a security-critical codebase. Every line should be easy to audit.

> "Explicit is better than implicit. Safe is better than clever."

---

## Language & Config

- **TypeScript strict mode** is mandatory. No `any` types except where absolutely unavoidable and explicitly commented.
- `tsconfig.json` must include `"strict": true`.
- All files use `.ts` or `.tsx` extensions. No plain `.js` files in `src/`.

---

## Naming Conventions

### Files
| Context | Convention | Example |
|---|---|---|
| Services | `kebab-case.service.ts` | `auth.service.ts` |
| Repositories | `kebab-case.repository.ts` | `user.repository.ts` |
| Validators | `kebab-case.schema.ts` | `signup.schema.ts` |
| Components | `PascalCase.tsx` | `PasswordStrengthIndicator.tsx` |
| Utilities | `kebab-case.ts` | `rate-limit.ts` |
| Email templates | `PascalCase.tsx` | `VerifyEmail.tsx` |

### Variables & Functions
- `camelCase` for variables and function names.
- `PascalCase` for React components, classes, and types/interfaces.
- `SCREAMING_SNAKE_CASE` for true constants (values that never change): `const SALT_ROUNDS = 12`.
- Boolean variables should read as questions: `isVerified`, `hasExpired`, `isLoading`.

### Functions
- Name functions after what they **do**, not what they **are**: `hashPassword` not `passwordHasher`.
- Repository functions describe the DB operation: `findUserByEmail`, `createVerificationToken`, `deletePasswordResetToken`.
- Service functions describe the business action: `registerUser`, `sendVerificationEmail`, `validateResetToken`.

---

## TypeScript Rules

### Always Define Return Types on Public Functions
```ts
// ✅ Good
async function findUserByEmail(email: string): Promise<User | null> { ... }

// ❌ Bad
async function findUserByEmail(email: string) { ... }
```

### Prefer Interfaces for Object Shapes
```ts
// ✅ Good
interface SignupInput {
  name: string;
  email: string;
  password: string;
}

// Use type for unions and computed types
type AuthResult = { success: true; user: User } | { success: false; error: string };
```

### No `any` — Use `unknown` for Truly Unknown Values
```ts
// ✅ Good
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";
}

// ❌ Bad
} catch (error: any) {
  console.error(error.message);
}
```

### Avoid Non-Null Assertions
```ts
// ✅ Good — handle the null case
const user = await findUserByEmail(email);
if (!user) return errorResponse("Invalid credentials");

// ❌ Bad
const user = await findUserByEmail(email)!;
```

---

## Function Structure

Keep functions **short and single-purpose**. If a function does more than one thing, split it.

```ts
// ✅ Good — each function does one thing
async function registerUser(input: SignupInput): Promise<void> {
  await assertEmailIsUnique(input.email);
  const hashedPassword = await hashPassword(input.password);
  const user = await createUser({ ...input, password: hashedPassword });
  const token = await createVerificationToken(user.email);
  await sendVerificationEmail(user.email, user.name, token);
}

// ❌ Bad — mixed concerns, hard to test
async function registerUser(input: SignupInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new Error("exists");
  const hash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({ data: { ...input, password: hash } });
  const token = crypto.randomBytes(32).toString("hex");
  await prisma.verificationToken.create({ ... });
  await resend.emails.send({ ... });
}
```

---

## API Route Handlers

Route handlers must follow this exact pattern:

```ts
export async function POST(req: Request): Promise<NextResponse> {
  try {
    // 1. Parse body
    const body = await req.json();

    // 2. Validate with Zod
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 400);
    }

    // 3. Rate limit check (if applicable)
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    const { success: allowed } = await rateLimiter.limit(ip);
    if (!allowed) return errorResponse("Too many requests", 429);

    // 4. Delegate to service
    await authService.registerUser(parsed.data);

    // 5. Return standard response
    return successResponse("Account created. Please verify your email.");
  } catch (error: unknown) {
    console.error("[signup]", error);
    return errorResponse("Something went wrong", 500);
  }
}
```

**Rules:**
- Always wrap in `try/catch`.
- Always log errors server-side with a route label.
- Never return the caught `error` object to the client.
- Always use `successResponse` / `errorResponse` helpers from `src/lib/response.ts`.

---

## Error Handling

### Server-Side
```ts
// ✅ Log full error, return generic message
try {
  await authService.registerUser(data);
} catch (error: unknown) {
  console.error("[POST /api/auth/signup]", error);
  return errorResponse("Something went wrong", 500);
}
```

### Service Layer
```ts
// ✅ Throw descriptive errors for expected failures
// These are caught by the route handler and converted to safe messages
if (!user) throw new Error("USER_NOT_FOUND");
if (hasExpired) throw new Error("TOKEN_EXPIRED");
```

### Never Do This
```ts
// ❌ Never return internal error details
return NextResponse.json({ error: error.message }); // leaks internals
return NextResponse.json({ stack: error.stack });   // leaks internals
```

---

## Validation Pattern (Zod)

Define schemas in `src/server/validators/`. Use `safeParse` in route handlers (not `parse`, which throws).

```ts
// src/server/validators/signup.schema.ts
import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a number"),
});

export type SignupInput = z.infer<typeof signupSchema>;
```

---

## Imports

- Use absolute imports from `src/` (configured via `tsconfig.json` paths).
- Group imports: external packages → internal modules → types.
- No barrel files (`index.ts`) unless the folder has 4+ exports.

```ts
// ✅ Good
import { NextResponse } from "next/server";
import { z } from "zod";

import { authService } from "@/server/services/auth.service";
import { successResponse, errorResponse } from "@/lib/response";

import type { SignupInput } from "@/server/validators/signup.schema";
```

---

## Comments

Write comments for **why**, not **what**. The code explains what; comments explain intent and non-obvious decisions.

```ts
// ✅ Good — explains security reasoning
// Return the same message whether email exists or not to prevent email enumeration
return successResponse("If an account exists, a reset email has been sent.");

// ❌ Bad — restates the code
// Return success response
return successResponse("...");
```

Add a JSDoc comment on every exported service function:

```ts
/**
 * Generates a secure password reset token, stores it with a 1-hour expiry,
 * and dispatches a reset email. Always resolves — never reveals email existence.
 */
export async function initiatePasswordReset(email: string): Promise<void> { ... }
```

---

## Component Style (React / TailwindCSS)

- Functional components only. No class components.
- Props interface defined above the component, named `[ComponentName]Props`.
- Keep components focused — if a component exceeds ~100 lines, extract sub-components.
- All form inputs must have accessible `<label>` elements.
- Loading and disabled states are required on all submit buttons.

```tsx
interface SubmitButtonProps {
  isLoading: boolean;
  label: string;
}

export function SubmitButton({ isLoading, label }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={isLoading}
      className="w-full bg-gray-900 text-white text-sm font-medium py-2.5 px-4 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
    >
      {isLoading ? "Loading..." : label}
    </button>
  );
}
```

---

## What to Avoid

| Anti-pattern | Why |
|---|---|
| Business logic in route handlers | Hard to test, violates separation of concerns |
| Prisma calls outside repositories | Logic scattered, impossible to audit |
| `console.log` in committed code | Use `console.error` for caught errors only |
| Hardcoded strings for error messages | Define constants or use the validator messages |
| `// @ts-ignore` or `// @ts-expect-error` | Fix the type, don't suppress it |
| Inline styles in components | Use Tailwind classes only |
| Direct `process.env` access outside `src/lib/` | Centralise env access for easier auditing |