import { NextRequest } from "next/server";
import { forgotPasswordSchema } from "@/server/validators/auth.schema";
import { initiatePasswordReset } from "@/server/services/user.service";
import { checkRateLimit } from "@/server/services/rateLimit.service";
import { getClientIp } from "@/lib/getIp";
import { jsonSuccess, jsonError } from "@/lib/response";

/**
 * Handles POST requests for initiating a password reset.
 * Enforces strict sliding window IP rate limiting.
 * Prevents account enumeration by always returning an identical success response.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Enforce IP Rate Limiting (5 attempts / 10 minutes)
    const clientIp = getClientIp(req);
    const isAllowed = await checkRateLimit(clientIp, "forgot-password");
    if (!isAllowed) {
      return jsonError("Too many attempts. Please try again later.", 429);
    }

    const body = await req.json();

    // 2. Server-side Input Validation
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0].message, 400);
    }

    const { email } = parsed.data;

    // 3. Delegate to Business Logic Layer (silently ignores non-existent accounts)
    await initiatePasswordReset(email);

    // 4. Return Identical Generic Success Message (prevents enumeration)
    return jsonSuccess("If an account exists for this email, a reset link has been sent.", {});
  } catch (error: unknown) {
    console.error("[POST /api/auth/forgot-password] Forgot password API error:", error);
    return jsonError("An unexpected server error occurred. Please try again later.", 500);
  }
}
