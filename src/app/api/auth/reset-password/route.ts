import { NextRequest } from "next/server";
import { resetPasswordSchema } from "@/server/validators/auth.schema";
import { resetPassword } from "@/server/services/user.service";
import { jsonSuccess, jsonError } from "@/lib/response";

export const dynamic = "force-dynamic";

/**
 * Handles POST requests for applying a new password via a reset token.
 * Validates token validity, enforces password complexity constraints via Zod,
 * updates user credentials, and deletes the consumed reset token.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password } = body;

    // 1. Validate payload attributes
    if (!token) {
      return jsonError("A valid password reset token is required.", 400);
    }

    // 2. Validate new password strength server-side
    const parsed = resetPasswordSchema.safeParse({ password });
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0].message, 400);
    }

    // 3. Delegate to Business Layer (token check -> bcrypt -> update user -> delete token)
    await resetPassword(token, password);

    // 4. Return standard success response
    return jsonSuccess(
      "Your password has been successfully reset. You can now login with your new credentials.",
      {}
    );
  } catch (error: unknown) {
    console.error("[POST /api/auth/reset-password] Reset password API error:", error);

    const errorMessage = error instanceof Error ? error.message : "";

    // Safely parse tokens exceptions
    if (errorMessage === "TOKEN_INVALID" || errorMessage === "TOKEN_EXPIRED") {
      return jsonError(
        "The password reset link is invalid or has expired. Please request a new link.",
        400
      );
    }

    return jsonError("An unexpected server error occurred. Please try again later.", 500);
  }
}
