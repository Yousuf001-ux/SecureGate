import crypto from "crypto";
import * as tokenRepo from "../repositories/token.repo";

/**
 * Generates a cryptographically secure 256-bit entropy token (64 hex characters).
 */
function generateSecureTokenString(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Generates a verification token for signup. Expired in 15 minutes.
 */
export async function generateVerificationToken(email: string): Promise<string> {
  const token = generateSecureTokenString();
  const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  await tokenRepo.createVerificationToken(email, token, expires);
  return token;
}

/**
 * Generates a password reset token. Expired in 1 hour.
 */
export async function generatePasswordResetToken(email: string): Promise<string> {
  const token = generateSecureTokenString();
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await tokenRepo.createPasswordResetToken(email, token, expires);
  return token;
}

/**
 * Validates a verification token.
 * If valid, immediately deletes it (one-time use) and returns the associated email.
 * Throws "TOKEN_INVALID" or "TOKEN_EXPIRED".
 */
export async function validateAndConsumeVerificationToken(tokenString: string): Promise<string> {
  const record = await tokenRepo.findVerificationTokenByToken(tokenString);

  if (!record) {
    throw new Error("TOKEN_INVALID");
  }

  if (record.expires < new Date()) {
    throw new Error("TOKEN_EXPIRED");
  }

  // Airtight single-use constraint: delete the token BEFORE doing anything else
  await tokenRepo.deleteVerificationToken(tokenString);

  return record.identifier; // Return email associated with the token
}

/**
 * Validates a password reset token.
 * If valid, returns the associated email. Otherwise, throws.
 * Note: Does not delete immediately so the user can render the page and submit the form.
 */
export async function validatePasswordResetToken(tokenString: string): Promise<string> {
  const record = await tokenRepo.findPasswordResetTokenByToken(tokenString);

  if (!record) {
    throw new Error("TOKEN_INVALID");
  }

  if (record.expires < new Date()) {
    throw new Error("TOKEN_EXPIRED");
  }

  return record.email;
}

/**
 * Consumes (deletes) a password reset token after it has been used to reset a password.
 */
export async function consumePasswordResetToken(tokenString: string): Promise<void> {
  await tokenRepo.deletePasswordResetToken(tokenString);
}
