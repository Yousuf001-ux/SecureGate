import { NextRequest } from "next/server";
import { signupSchema } from "@/server/validators/auth.schema";
import { registerUser } from "@/server/services/user.service";
import { jsonSuccess, jsonError } from "@/lib/response";

/**
 * Handles POST requests for user registration.
 * Validates request payload, hashes password in the service layer, stores user and verification token,
 * and returns standard JSON responses.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Server-Side Zod Validation
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0].message, 400);
    }

    const { name, email, password } = parsed.data;

    // 2. Delegate to Business Logic Layer
    await registerUser(name, email, password);

    // 3. Return Standard Success Response
    return jsonSuccess(
      "Registration successful! Please check your inbox for a verification email.",
      {},
      201
    );
  } catch (error: unknown) {
    console.error("[POST /api/auth/signup] Internal signup error:", error);

    const errorMessage = error instanceof Error ? error.message : "";

    // If duplicate email check fails in the service layer, we catch it
    // and return a safe generic error message to prevent account enumeration.
    if (errorMessage === "REGISTRATION_FAILED") {
      return jsonError(
        "An account with these details could not be created. Please try again with different inputs.",
        400
      );
    }

    return jsonError("An unexpected server error occurred. Please try again later.", 500);
  }
}
