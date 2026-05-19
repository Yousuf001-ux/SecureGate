"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { AuthFormWrapper } from "@/components/AuthFormWrapper";

export default function VerifyRequiredPage() {
  const { data: session } = useSession();

  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);

  const handleResend = async () => {
    if (!session?.user?.email) {
      setServerError("Could not find session email. Please try logging in again.");
      return;
    }

    setIsLoading(true);
    setServerError(null);
    setServerSuccess(null);

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session.user.email }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        setServerError(result.message || "Failed to resend verification email.");
      } else {
        setServerSuccess("Verification link sent! Please check your email inbox.");
      }
    } catch (err: unknown) {
      console.error("[Resend Verification UI Error]:", err);
      setServerError("An unexpected error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <AuthFormWrapper
      title="Verification Required"
      subtitle="Your email must be verified before you can access the dashboard."
      footer={
        <button
          onClick={handleLogout}
          className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors underline"
        >
          Sign Out of Account
        </button>
      }
    >
      <div className="space-y-6">
        {/* Security Warning Icon Banner */}
        <div className="flex flex-col items-center justify-center text-center p-4 bg-yellow-50/50 border border-yellow-200/60 rounded-2xl">
          <svg
            className="w-10 h-10 text-yellow-600 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="text-sm text-yellow-800 font-medium px-2 leading-relaxed">
            We sent a verification link to{" "}
            <strong className="text-gray-950 font-bold block mt-1 break-all">
              {session?.user?.email || "your registered address"}
            </strong>
          </p>
        </div>

        {/* Server Success Display */}
        {serverSuccess && (
          <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3" role="status">
            <svg
              className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-emerald-800 font-medium">{serverSuccess}</p>
          </div>
        )}

        {/* Server Error Display */}
        {serverError && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3" role="alert">
            <svg
              className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-red-700 font-medium">{serverError}</p>
          </div>
        )}

        <div className="space-y-3">
          {/* Resend Action Button */}
          <button
            onClick={handleResend}
            disabled={isLoading || !!serverSuccess}
            className="w-full bg-gray-900 text-white text-sm font-semibold py-2.5 px-4 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 shadow-sm"
          >
            {isLoading ? "Resending Link..." : "Resend Verification Email"}
          </button>
          
          <p className="text-center text-xs text-gray-400">
            Please allow up to 2 minutes for transmission. Link expires in 15 minutes.
          </p>
        </div>
      </div>
    </AuthFormWrapper>
  );
}
