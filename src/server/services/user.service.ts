import * as userRepo from "../repositories/user.repo";
import * as tokenService from "./token.service";
import * as emailService from "./email.service";
import { hashPassword } from "@/lib/bcrypt";

/**
 * Registers a new user.
 * Hashes password (12 cost), stores record, generates 15-min verification token, and sends transactional email.
 * Prevents account enumeration by returning a generic error if the email is already registered.
 */
export async function registerUser(name: string, email: string, password: string): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Check for duplicate email
  const existingUser = await userRepo.findUserByEmail(normalizedEmail);
  if (existingUser) {
    // Audit log server-side only
    console.warn(`[Signup Service] Duplicate registration attempted for: ${normalizedEmail}`);
    // Throw a generic error to route layer to prevent leakage
    throw new Error("REGISTRATION_FAILED");
  }

  // 2. Hash password (bcryptjs, cost=12)
  const hashedPassword = await hashPassword(password);

  // 3. Create user in DB (initially unverified)
  const user = await userRepo.createUser({
    name,
    email: normalizedEmail,
    password: hashedPassword,
    emailVerified: null,
  });

  // 4. Generate verification token
  const token = await tokenService.generateVerificationToken(normalizedEmail);

  // 5. Dispatch email containing verification CTA
  await emailService.sendVerificationEmail(normalizedEmail, user.name, token);
}

/**
 * Resends verification email to an unverified user.
 * Silently succeeds if the user does not exist or is already verified to block account enumeration.
 */
export async function resendVerificationEmail(email: string): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await userRepo.findUserByEmail(normalizedEmail);
  if (!user || user.emailVerified !== null) {
    console.log(`[Resend Verification] Request ignored (not found or already verified): ${normalizedEmail}`);
    // Silently return success to avoid leakage
    return;
  }

  // Generate new token and dispatch email
  const token = await tokenService.generateVerificationToken(normalizedEmail);
  await emailService.sendVerificationEmail(normalizedEmail, user.name, token);
}

/**
 * Verifies email verification token.
 * On success, marks user verified and deletes the token.
 */
export async function verifyUserEmail(tokenString: string): Promise<void> {
  // Validate token (deletes token immediately on successful validation to avoid reuse)
  const email = await tokenService.validateAndConsumeVerificationToken(tokenString);

  // Update user in database
  await userRepo.markEmailVerified(email);
}

/**
 * Triggers a password reset token and email dispatch.
 * Silently succeeds if user is not found to prevent account enumeration.
 */
export async function initiatePasswordReset(email: string): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await userRepo.findUserByEmail(normalizedEmail);
  if (!user) {
    console.log(`[Password Reset] Request ignored (user not found): ${normalizedEmail}`);
    // Silently return success so route returns identical success response
    return;
  }

  // Generate reset token and send reset email
  const token = await tokenService.generatePasswordResetToken(normalizedEmail);
  await emailService.sendPasswordResetEmail(normalizedEmail, user.name, token);
}

/**
 * Resets a user's password using a reset token.
 * Validates token, hashes new password (12 cost), saves in DB, and consumes the token.
 */
export async function resetPassword(tokenString: string, passwordInput: string): Promise<void> {
  // 1. Validate token (does not delete token yet, so we have it for user metadata if needed)
  const email = await tokenService.validatePasswordResetToken(tokenString);

  // 2. Hash new password
  const hashedPassword = await hashPassword(passwordInput);

  // 3. Update password in user database
  await userRepo.updateUserPassword(email, hashedPassword);

  // 4. Consume (delete) the token immediately upon password update success
  await tokenService.consumePasswordResetToken(tokenString);
}
