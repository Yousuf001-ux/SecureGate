import { NextRequest } from "next/server";
import { forgotPasswordSchema } from "@/server/validators/auth.schema";
import { resendVerificationEmail } from "@/server/services/user.service";
import { jsonSuccess, jsonError } from "@/lib/response";

export const dynamic = "force-dynamic";

/**
 * Handles POST requests for resending the email verification token.
 * Validates request payload and triggers new token generation and email dispatch.
 * Prevents account enumeration by returning a generic success message.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Zod Validation
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0].message, 400);
    }

    const { email } = parsed.data;

    // 2. Delegate to Business Logic Layer
    await resendVerificationEmail(email);

    // 3. Return Standard success response
    return jsonSuccess("If details are valid, a new verification link has been sent.", {});
  } catch (error: unknown) {
    console.error("[POST /api/auth/resend-verification] Error resending verification:", error);
    return jsonError("An unexpected server error occurred. Please try again later.", 500);
  }
}
