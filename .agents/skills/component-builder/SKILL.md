---
name: component-builder
description: Builds secure, accessible UI components for SecureGate with loading states, validation, and password strength indicators.
---

# Component Builder Skill

## Required Components

| Page              | Route                     | Key Features |
|------------------|--------------------------|--------------|
| Signup           | `/signup`               | Name, email, password, strength indicator, loading state |
| Login            | `/login`                | Email, password, generic error messages |
| Forgot Password  | `/forgot-password`      | Email only, always shows success |
| Reset Password   | `/reset-password/[token]` | New password, confirm, strength indicator |
| Dashboard        | `/dashboard`            | Protected content, logout button |
| Verify Required  | `/verify-required`      | Resend button, logout button |
| Verify Email     | `/verify-email/[token]` | Success/error UI |

---

## Password Strength Logic

- **Weak:** length < 8  
- **Fair:** length ≥ 8 and (hasLower OR hasUpper) and (hasNumber OR hasSymbol)  
- **Strong:** length ≥ 10 and hasLower and hasUpper and hasNumber and hasSymbol  

---

## Form Pattern

```tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signupSchema } from '@/server/validators/signup.schema';
import type { SignupInput } from '@/server/validators/signup.schema';

export function SignupForm(): JSX.Element {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema)
  });

  const onSubmit = async (data: SignupInput): Promise<void> => {
    setIsLoading(true);
    setServerError(null);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      if (!result.success) {
        setServerError(result.message || 'Something went wrong');
      } else {
        // Handle successful sign up (e.g. redirect)
      }
    } catch (err: unknown) {
      console.error('[signup_form_error]', err);
      setServerError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {serverError && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-sm text-red-700">{serverError}</p>
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Full Name
        </label>
        <input
          id="name"
          type="text"
          {...register('name')}
          disabled={isLoading}
          className={`w-full px-3 py-2 border rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 ${
            errors.name ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
          }`}
          placeholder="John Doe"
        />
        {errors.name && (
          <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          {...register('email')}
          disabled={isLoading}
          className={`w-full px-3 py-2 border rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 ${
            errors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
          }`}
          placeholder="you@example.com"
        />
        {errors.email && (
          <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="password"
          type="password"
          {...register('password')}
          disabled={isLoading}
          className={`w-full px-3 py-2 border rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 ${
            errors.password ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
          }`}
          placeholder="••••••••"
        />

        <PasswordStrengthIndicator password={watch('password') || ''} />

        {errors.password && (
          <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gray-900 text-white text-sm font-medium py-2.5 px-4 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
      >
        {isLoading ? 'Creating account...' : 'Create Account'}
      </button>
    </form>
  );
}

## Password Strength Component

```tsx
'use client';

interface StrengthMetrics {
  label: 'Weak' | 'Fair' | 'Strong';
  color: 'bg-red-500' | 'bg-yellow-400' | 'bg-green-500';
  width: '33%' | '66%' | '100%';
  labelClass: 'text-red-600' | 'text-yellow-700' | 'text-green-700';
}

export function PasswordStrengthIndicator({ password }: { password: string }): JSX.Element | null {
  const getStrength = (pwd: string): StrengthMetrics => {
    const hasLower = /[a-z]/.test(pwd);
    const hasUpper = /[A-Z]/.test(pwd);
    const hasNumber = /\d/.test(pwd);
    const hasSymbol = /[^a-zA-Z0-9]/.test(pwd);

    // 1. Weak check: length < 8
    if (pwd.length < 8) {
      return {
        label: 'Weak',
        color: 'bg-red-500',
        width: '33%',
        labelClass: 'text-red-600'
      };
    }

    // 2. Strong check: length >= 10 and hasLower and hasUpper and hasNumber and hasSymbol
    if (pwd.length >= 10 && hasLower && hasUpper && hasNumber && hasSymbol) {
      return {
        label: 'Strong',
        color: 'bg-green-500',
        width: '100%',
        labelClass: 'text-green-700'
      };
    }

    // 3. Fair check: length >= 8 and (hasLower or hasUpper) and (hasNumber or hasSymbol)
    if (pwd.length >= 8 && (hasLower || hasUpper) && (hasNumber || hasSymbol)) {
      return {
        label: 'Fair',
        color: 'bg-yellow-400',
        width: '66%',
        labelClass: 'text-yellow-700'
      };
    }

    // 4. Fallback (e.g. length >= 8 but lacking required casing, numbers or symbols)
    return {
      label: 'Weak',
      color: 'bg-red-500',
      width: '33%',
      labelClass: 'text-red-600'
    };
  };

  if (!password) return null;

  const strength = getStrength(password);

  return (
    <div className="mt-2 space-y-1">
      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
          style={{ width: strength.width }}
        />
      </div>
      <p className={`text-xs font-medium ${strength.labelClass}`}>
        Strength: {strength.label}
      </p>
    </div>
  );
}
```



### Email Templates (React Email)
- VerifyEmail.tsx
  - Subject: "Verify your SecureGate account"
  - Includes 15-minute expiry warning
- ResetPassword.tsx
  - Subject: "Reset your SecureGate password"
  - Includes 1-hour expiry warning

### Security Rules
-Error messages must be generic:
    - ❌ "Password incorrect"
    - ✅ "Invalid credentials"
-Submit buttons must be disabled during async operations
-Show rate limit message on HTTP 429
-All inputs must have accessible labels (htmlFor required)

### Non-Goals
-No hardcoded API endpoints (use relative paths like /api/auth/...)
-No localStorage for sensitive data
-No client-side redirects that bypass middleware

