import Link from "next/link";
import { verifyUserEmail } from "@/server/services/user.service";

interface VerifyEmailProps {
  params: {
    token: string;
  };
}

/**
 * Server-Side Email Verification Endpoint.
 * Validates and consumes the token in the DB instantly on render,
 * and renders a visually rich success or error UI with zero client round-trips.
 */
export default async function VerifyEmailPage({ params }: VerifyEmailProps) {
  const token = params.token;
  let isSuccess = false;
  let errorCode = "";

  try {
    await verifyUserEmail(token);
    isSuccess = true;
  } catch (error: unknown) {
    console.error("[Email Verification Page] Failed:", error);
    if (error instanceof Error) {
      errorCode = error.message;
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-center">
        {/* Brand Header */}
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gray-900 text-white font-bold text-xl mb-4 shadow-sm">
          SG
        </div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900 mb-2">
          SecureGate Verification
        </h1>

        {isSuccess ? (
          /* Successful State UI */
          <div className="mt-6 space-y-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Email Verified!</h2>
            <p className="text-sm text-gray-500 px-2 leading-relaxed">
              Your email has been verified successfully. Your account is now fully active.
            </p>
            <div className="pt-4">
              <Link
                href="/login"
                className="inline-flex justify-center items-center w-full bg-gray-900 text-white text-sm font-semibold py-2.5 px-4 rounded-lg hover:bg-gray-700 transition-colors shadow-sm"
              >
                Go to Login
              </Link>
            </div>
          </div>
        ) : (
          /* Failed/Expired State UI */
          <div className="mt-6 space-y-4">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Verification Failed</h2>
            <p className="text-sm text-gray-500 px-2 leading-relaxed">
              {errorCode === "TOKEN_EXPIRED"
                ? "The verification link has expired. Email verification links are only valid for 15 minutes."
                : "The verification link is invalid, has already been used, or does not exist."}
            </p>
            <div className="pt-4">
              <Link
                href="/login"
                className="inline-flex justify-center items-center w-full border border-gray-300 text-gray-700 text-sm font-semibold py-2.5 px-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
