import { prisma } from "@/lib/prisma";
import type { VerificationToken, PasswordResetToken } from "@prisma/client";

/* =========================================================================
   EMAIL VERIFICATION TOKENS
   ========================================================================= */

/**
 * Creates and stores a new email verification token.
 */
export async function createVerificationToken(
  email: string,
  token: string,
  expires: Date
): Promise<VerificationToken> {
  // Clear any existing tokens for this identifier first to avoid duplicates or flooding
  try {
    await prisma.verificationToken.deleteMany({
      where: { identifier: email.toLowerCase() },
    });
  } catch {
    // Suppress if no tokens exist to delete
  }

  return prisma.verificationToken.create({
    data: {
      identifier: email.toLowerCase(),
      token,
      expires,
    },
  });
}

/**
 * Finds a verification token by its unique string.
 */
export async function findVerificationTokenByToken(token: string): Promise<VerificationToken | null> {
  return prisma.verificationToken.findUnique({
    where: { token },
  });
}

/**
 * Deletes a verification token from the database.
 */
export async function deleteVerificationToken(token: string): Promise<void> {
  await prisma.verificationToken.delete({
    where: { token },
  });
}

/* =========================================================================
   PASSWORD RESET TOKENS
   ========================================================================= */

/**
 * Creates and stores a new password reset token.
 */
export async function createPasswordResetToken(
  email: string,
  token: string,
  expires: Date
): Promise<PasswordResetToken> {
  // Clear existing reset tokens for this email first
  try {
    await prisma.passwordResetToken.deleteMany({
      where: { email: email.toLowerCase() },
    });
  } catch {
    // Suppress if none exist
  }

  return prisma.passwordResetToken.create({
    data: {
      email: email.toLowerCase(),
      token,
      expires,
    },
  });
}

/**
 * Finds a password reset token by its unique string.
 */
export async function findPasswordResetTokenByToken(token: string): Promise<PasswordResetToken | null> {
  return prisma.passwordResetToken.findUnique({
    where: { token },
  });
}

/**
 * Deletes a password reset token from the database.
 */
export async function deletePasswordResetToken(token: string): Promise<void> {
  await prisma.passwordResetToken.delete({
    where: { token },
  });
}
