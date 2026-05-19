"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { resetPasswordSchema, type ResetPasswordInput } from "@/server/validators/auth.schema";
import { AuthFormWrapper } from "@/components/AuthFormWrapper";
import { PasswordInput } from "@/components/PasswordInput";

interface ResetPasswordProps {
  params: {
    token: string;
  };
}

export default function ResetPasswordPage({ params }: ResetPasswordProps) {
  const token = params.token;
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
  });

  const watchedPassword = watch("password", "");

  const onSubmit = async (data: ResetPasswordInput) => {
    setIsLoading(true);
    setServerError(null);
    setServerSuccess(null);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        setServerError(result.message || "An error occurred while resetting your password.");
      } else {
        setServerSuccess(result.message || "Password successfully changed!");
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      }
    } catch (err: unknown) {
      console.error("[Reset Password UI Error]:", err);
      setServerError("An unexpected error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthFormWrapper
      title="Set a new password"
      subtitle="Establish strong, unguessable security credentials below."
      footer={
        <p className="text-sm text-gray-500">
          Cancel and return to{" "}
          <Link
            href="/login"
            className="font-medium text-gray-900 underline hover:text-gray-700 transition-colors"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Safe server-side error feedback */}
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

        {/* Safe server-side success feedback */}
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
            <p className="text-sm text-emerald-800 font-medium">
              {serverSuccess} Redirecting to login...
            </p>
          </div>
        )}

        {/* Password Input */}
        <PasswordInput
          id="password"
          label="New Password"
          registration={register("password")}
          error={errors.password}
          disabled={isLoading || !!serverSuccess}
          showStrengthIndicator
          watchedPassword={watchedPassword}
        />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !!serverSuccess}
          className="w-full bg-blue-600 text-white text-sm font-semibold py-2.5 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 shadow-sm"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Updating Password...
            </span>
          ) : (
            "Change Password"
          )}
        </button>
      </form>
    </AuthFormWrapper>
  );
}
