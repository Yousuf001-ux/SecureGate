import { z } from "zod";

/**
 * Shared Zod Schema for User Signup input validation.
 */
export const signupSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must not exceed 50 characters")
    .trim(),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
});

export type SignupInput = z.infer<typeof signupSchema>;

/**
 * Shared Zod Schema for User Login input validation.
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Shared Zod Schema for Forgot Password input validation.
 */
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .toLowerCase()
    .trim(),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

/**
 * Shared Zod Schema for Reset Password input validation.
 */
export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
