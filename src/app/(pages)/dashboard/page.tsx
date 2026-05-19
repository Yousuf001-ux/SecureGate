"use client";

import { useSession, signOut } from "next-auth/react";

interface CustomUser {
  name?: string | null;
  email?: string | null;
  emailVerified?: Date | string | null;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-gray-900" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-sm font-semibold text-gray-600">Resolving secure session...</p>
        </div>
      </main>
    );
  }

  // Fallback in case of client routing delay (middleware protects this page comprehensively)
  if (!session) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col justify-between">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gray-900 text-white font-bold flex items-center justify-center text-sm">
              SG
            </div>
            <span className="font-bold text-gray-900 text-base tracking-tight">
              SecureGate Control
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-semibold text-gray-900">
                {session.user?.name || "System Operator"}
              </span>
              <span className="text-xs text-emerald-600 font-medium flex items-center justify-end gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Fully Verified
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="bg-gray-900 text-white text-xs font-semibold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors shadow-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Grid Body */}
      <section className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {/* Welcome Header Banner */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              Welcome Back, {session.user?.name || "User"}!
            </h1>
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">
              Your auth session is active, fully verified, and shielded by our middleware protection boundaries.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-250 text-emerald-800 text-xs font-semibold">
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Session Hardened
          </div>
        </div>

        {/* Stats Grid cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Card 1 */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:border-gray-300 transition-colors">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Profile Email
            </h3>
            <p className="text-base font-bold text-gray-900 mt-2 break-all">
              {session.user?.email}
            </p>
            <div className="mt-4 text-xs text-gray-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Case-Normalized Entry
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:border-gray-300 transition-colors">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Auth Mechanism
            </h3>
            <p className="text-lg font-bold text-gray-900 mt-2">
              Credentials Provider
            </p>
            <div className="mt-4 text-xs text-gray-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              Stateless JWT Tokenized
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:border-gray-300 transition-colors">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Verification Stamp
            </h3>
            <p className="text-lg font-bold text-gray-900 mt-2">
              {session?.user && (session.user as CustomUser).emailVerified
                ? new Date((session.user as CustomUser).emailVerified as string).toLocaleString()
                : "Active"}
            </p>
            <div className="mt-4 text-xs text-gray-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              One-Time Expired Token
            </div>
          </div>
        </div>

        {/* Security Log Summary Mock */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="border-b border-gray-150 px-6 py-4 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Hardened Security Parameters</h3>
            <span className="text-xs text-gray-400 font-medium">Compliance MVP v1.0</span>
          </div>
          <div className="divide-y divide-gray-100 text-sm">
            <div className="px-6 py-3.5 flex justify-between items-center hover:bg-gray-50/50">
              <span className="text-gray-600 font-medium">Password Hashing Algorithm</span>
              <code className="text-xs font-semibold bg-gray-100 text-gray-900 py-1 px-2.5 rounded-md">
                bcryptjs (Cost 12 salt rounds)
              </code>
            </div>
            <div className="px-6 py-3.5 flex justify-between items-center hover:bg-gray-50/50">
              <span className="text-gray-600 font-medium">Verification Token Validity Window</span>
              <code className="text-xs font-semibold bg-gray-100 text-gray-900 py-1 px-2.5 rounded-md">
                15 Minutes (256-bit entropy)
              </code>
            </div>
            <div className="px-6 py-3.5 flex justify-between items-center hover:bg-gray-50/50">
              <span className="text-gray-600 font-medium">Forgot Password Recovery Window</span>
              <code className="text-xs font-semibold bg-gray-100 text-gray-900 py-1 px-2.5 rounded-md">
                1 Hour (256-bit entropy)
              </code>
            </div>
            <div className="px-6 py-3.5 flex justify-between items-center hover:bg-gray-50/50">
              <span className="text-gray-600 font-medium">Anti Brute-Force Sliding Window Limit</span>
              <code className="text-xs font-semibold bg-gray-100 text-gray-900 py-1 px-2.5 rounded-md">
                5 Attempts / 10 Minutes per IP
              </code>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-400 py-8">
        &copy; {new Date().getFullYear()} SecureGate. Session verified. Built with Next.js 14 App Router.
      </footer>
    </main>
  );
}
