import nodemailer from "nodemailer";
import { renderVerifyEmailHtml } from "@/emails/VerifyEmail";
import { renderResetPasswordHtml } from "@/emails/ResetPassword";

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: { user, pass },
  });
}

const FROM_EMAIL = process.env.SMTP_FROM || "SecureGate <noreply@securegate.app>";

function isSmtpConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendVerificationEmail(email: string, name: string, token: string): Promise<void> {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const verificationLink = `${baseUrl}/verify-email/${token}`;

  if (!isSmtpConfigured()) {
    console.log("\n======================================================================");
    console.log(`[Nodemailer Mock] Email Verification requested for ${name} (${email}):`);
    console.log(`Click this link to verify: ${verificationLink}`);
    console.log("This link will expire in 15 minutes.");
    console.log("======================================================================\n");
    return;
  }

  const transporter = createTransporter();

  try {
    await transporter!.sendMail({
      from: FROM_EMAIL,
      to: email.toLowerCase(),
      subject: "Verify your SecureGate account",
      html: renderVerifyEmailHtml(name, verificationLink),
    });
  } catch (error: unknown) {
    console.error(`[EmailService] Failed to send verification email to ${email}`, error);
    throw new Error("EMAIL_DISPATCH_FAILURE");
  }
}

export async function sendPasswordResetEmail(email: string, name: string, token: string): Promise<void> {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const resetLink = `${baseUrl}/reset-password/${token}`;

  if (!isSmtpConfigured()) {
    console.log("\n======================================================================");
    console.log(`[Nodemailer Mock] Password Reset requested for ${name} (${email}):`);
    console.log(`Click this link to reset password: ${resetLink}`);
    console.log("This link will expire in 1 hour.");
    console.log("======================================================================\n");
    return;
  }

  const transporter = createTransporter();

  try {
    await transporter!.sendMail({
      from: FROM_EMAIL,
      to: email.toLowerCase(),
      subject: "Reset your SecureGate password",
      html: renderResetPasswordHtml(name, resetLink),
    });
  } catch (error: unknown) {
    console.error(`[EmailService] Failed to send password reset email to ${email}`, error);
    throw new Error("EMAIL_DISPATCH_FAILURE");
  }
}
