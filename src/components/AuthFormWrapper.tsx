import React from "react";

interface AuthFormWrapperProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthFormWrapper({ title, subtitle, children, footer }: AuthFormWrapperProps) {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* SecureGate Minimal Brand Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white font-bold text-xl mb-4 shadow-sm hover:scale-105 transition-transform">
            SG
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            SecureGate
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Hardened Authentication Layer
          </p>
        </div>

        {/* Outer Form Card */}
        <div className="mt-8 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {subtitle}
            </p>
          </div>

          {/* Form Children */}
          {children}

          {/* Optional Card Footer Actions */}
          {footer && (
            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
              {footer}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
