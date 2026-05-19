"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { loginSchema, type LoginInput } from "@/server/validators/auth.schema";
import { AuthFormWrapper } from "@/components/AuthFormWrapper";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setServerError(null);

    try {
      // Direct post to NextAuth credentials provider
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        // Enforce safe credentials error display:
        // Standard error returned is "CredentialsSignin" or throws standard limits.
        if (result.error.includes("Too many attempts") || result.error.includes("429")) {
          setServerError("Too many attempts. Please try again later.");
        } else {
          setServerError("Invalid email or password.");
        }
      } else {
        // Redirect to dashboard, which is intercepted by server-side middleware for verification checks
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: unknown) {
      console.error("[Login UI Submit Error]:", err);
      setServerError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthFormWrapper
      title="Sign in to your account"
      subtitle="Enter your credentials to cross the security barrier."
      footer={
        <div className="space-y-2">
          <p className="text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-gray-900 underline hover:text-gray-700 transition-colors"
            >
              Sign up
            </Link>
          </p>
          <p className="text-xs text-gray-400">
            Forgot your credentials?{" "}
            <Link
              href="/forgot-password"
              className="font-semibold text-gray-800 hover:text-gray-600 transition-colors"
            >
              Reset password
            </Link>
          </p>
        </div>
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

        {/* Email Input */}
        <div className="space-y-1">
          <label htmlFor="email" className="block text-sm font-semibold text-gray-750">
            Email address
          </label>
          <input
            id="email"
            type="email"
            disabled={isLoading}
            {...register("email")}
            className={`w-full px-3.5 py-2 border rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 transition-all ${
              errors.email ? "border-red-300 focus:ring-red-500" : "border-gray-355"
            }`}
            placeholder="you@example.com"
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {errors.email && (
            <p id="email-error" className="text-xs text-red-650 font-medium mt-1">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Input */}
        <div className="space-y-1">
          <label htmlFor="password" className="block text-sm font-semibold text-gray-750">
            Password
          </label>
          <input
            id="password"
            type="password"
            disabled={isLoading}
            {...register("password")}
            className={`w-full px-3.5 py-2 border rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 transition-all ${
              errors.password ? "border-red-300 focus:ring-red-500" : "border-gray-355"
            }`}
            placeholder="••••••••"
            aria-describedby={errors.password ? "password-error" : undefined}
          />
          {errors.password && (
            <p id="password-error" className="text-xs text-red-650 font-medium mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white text-sm font-semibold py-2.5 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 shadow-sm"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Verifying Credentials...
            </span>
          ) : (
            "Sign In"
          )}
        </button>
      </form>
    </AuthFormWrapper>
  );
}
