---
name: db-migration-runner
description: Manages Prisma schema migrations for SecureGate, ensuring database models match PRD requirements exactly.
---

# DB Migration Runner Skill

## Purpose

This skill is responsible for creating, running, and validating Prisma database migrations for SecureGate. It ensures that the database schema exactly matches the PRD's model definitions.

---

## When to Use

Use this skill when:

- Setting up the database for the first time  
- Modifying any Prisma model  
- Running migrations in development or production  
- Resetting the database  
- Seeding test data  

---

## Prisma Schema (from PRD)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  password      String
  emailVerified DateTime?
  createdAt     DateTime  @default(now())
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@id([identifier, token])
}

model PasswordResetToken {
  email   String
  token   String   @unique
  expires DateTime

  @@id([email, token])
}
```

---

## Migration Commands

```bash
# Generate migration after schema change
npx prisma migrate dev --name <descriptive_name>

# Example
npx prisma migrate dev --name add_verification_token_model

# Reset database (development only)
npx prisma migrate reset

# Open Prisma Studio to view data
npx prisma studio

# Production (Vercel) Deployment
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

---

## Migration Naming Convention

Use descriptive kebab-case names:

| Change Type | Example Name |
| :--- | :--- |
| New model | `add_verification_token_model` |
| Add field | `add_email_verified_to_users` |
| Remove field | `remove_temp_field` |
| Modify field | `change_password_type` |
| Add index | `add_token_index` |
| Add constraint | `add_unique_email_constraint` |

---

## Validation Checklist Before Running Migration

- [ ] All model names match PRD exactly (`User`, `VerificationToken`, `PasswordResetToken`) 
- [ ] All field names match PRD exactly
- [ ] Field types are correct (`String`, `DateTime`, `Boolean`, etc.)
- [ ] `emailVerified` is nullable (`DateTime?`)
- [ ] `password` is a bcrypt hash (`$2b$`)
- [ ] Token fields have `@unique` constraint
- [ ] Token expiry rules are correct:
  - `VerificationToken` → 15 minutes
  - `PasswordResetToken` → 1 hour
- [ ] No plain-text password storage exists
- [ ] Token fields are indexed or possess unique constraints for performance

---

## Post-Migration Verification

### Generate Prisma Client
```bash
npx prisma generate
```

### TypeScript Compilation Check
```bash
npx tsc --noEmit
```

### Database Connectivity Check (PowerShell & Bash Compatible)
```powershell
# PowerShell / CMD:
"SELECT 1" | npx prisma db execute --stdin --schema=prisma/schema.prisma

# Bash:
echo "SELECT 1" | npx prisma db execute --stdin --schema=prisma/schema.prisma
```

### Validate Queries & Seed Script

Ensure models can be queried in a test script or REPL. Below is a compliant seed script template:

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const hashedPassword = await bcrypt.hash('Test1234!', 12);

  await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      name: 'Test User',
      email: 'test@example.com',
      password: hashedPassword,
      emailVerified: new Date()
    }
  });

  console.log('Seed complete');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
```

### Run Seed
```bash
npx prisma db seed
```

---

## Troubleshooting

| Issue | Solution |
| :--- | :--- |
| **P1001:** Can't reach database | Check `DATABASE_URL` connectivity and config |
| **P1010:** Access denied | Verify DB credentials and user privileges |
| **Migration conflict** | Use `npx prisma migrate resolve` |
| **Shadow DB error (Vercel)** | Use `npx prisma migrate deploy` |
| **Drift detected** | Run `npx prisma migrate dev` or `db push` (dev only) |

---

## Environment Variables Required

- `DATABASE_URL="postgresql://postgres:password@localhost:5432/securegate"`

---

## Non-Goals

- Do not manually edit migration SQL files
- Do not skip migration generation
- Do not use `prisma db push` in production
- Do not commit `.env` files

---

## Definition of Done

A database change is complete when:

- [ ] Migration generated with descriptive name
- [ ] Migration runs successfully
- [ ] Prisma Client regenerated
- [ ] TypeScript compiles without errors
- [ ] Schema matches PRD exactly
- [ ] No sensitive data exposed in migration files