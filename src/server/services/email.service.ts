import { Resend } from "resend";
import React from "react";
import { VerifyEmail } from "@/emails/VerifyEmail";
import { ResetPassword } from "@/emails/ResetPassword";

const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder");

// Default verified sender address on Resend's free tier
const FROM_EMAIL = "onboarding@resend.dev"; 

/**
 * Sends a transactional verification email via Resend.
 * Falls back to terminal printing when placeholders are active.
 */
export async function sendVerificationEmail(email: string, name: string, token: string): Promise<void> {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const verificationLink = `${baseUrl}/verify-email/${token}`;

  const isResendActive = process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes("placeholder");

  if (!isResendActive) {
    console.log("\n======================================================================");
    console.log(`[Resend Mock] Email Verification requested for ${name} (${email}):`);
    console.log(`Click this link to verify: ${verificationLink}`);
    console.log("This link will expire in 15 minutes.");
    console.log("======================================================================\n");
    return;
  }

  try {
    await resend.emails.send({
      from: `SecureGate <${FROM_EMAIL}>`,
      to: email.toLowerCase(),
      subject: "Verify your SecureGate account",
      react: React.createElement(VerifyEmail, { name, verificationLink }),
    });
  } catch (error: unknown) {
    console.error(`[EmailService] Failed to send verification email to ${email}`, error);
    // Do not bubble the raw third-party email error; throw a clean operational error.
    throw new Error("EMAIL_DISPATCH_FAILURE");
  }
}

/**
 * Sends a transactional password reset email via Resend.
 * Falls back to terminal printing when placeholders are active.
 */
export async function sendPasswordResetEmail(email: string, name: string, token: string): Promise<void> {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const resetLink = `${baseUrl}/reset-password/${token}`;

  const isResendActive = process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes("placeholder");

  if (!isResendActive) {
    console.log("\n======================================================================");
    console.log(`[Resend Mock] Password Reset requested for ${name} (${email}):`);
    console.log(`Click this link to reset password: ${resetLink}`);
    console.log("This link will expire in 1 hour.");
    console.log("======================================================================\n");
    return;
  }

  try {
    await resend.emails.send({
      from: `SecureGate <${FROM_EMAIL}>`,
      to: email.toLowerCase(),
      subject: "Reset your SecureGate password",
      react: React.createElement(ResetPassword, { name, resetLink }),
    });
  } catch (error: unknown) {
    console.error(`[EmailService] Failed to send password reset email to ${email}`, error);
    throw new Error("EMAIL_DISPATCH_FAILURE");
  }
}
