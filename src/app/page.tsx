import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSideSession } from "@/server/auth/session";

/**
 * Server-Side Entry Page.
 * Performs instantaneous server-side redirection based on authentication state,
 * and renders a beautiful, minimal brand gateway for anonymous visitors.
 */
export default async function Home() {
  const session = await getServerSideSession();

  // Redirect authenticated sessions immediately
  if (session) {
    interface CustomUser {
      emailVerified?: Date | string | null;
    }
    const isVerified = (session.user as CustomUser).emailVerified;
    if (isVerified) {
      redirect("/dashboard");
    } else {
      redirect("/verify-required");
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col justify-between px-6 py-12">
      {/* Brand Header */}
      <header className="max-w-7xl w-full mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gray-900 text-white font-bold flex items-center justify-center text-base hover:rotate-12 transition-transform">
            SG
          </div>
          <span className="font-bold text-gray-900 text-lg tracking-tight">SecureGate</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="text-sm font-medium bg-gray-900 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors shadow-sm"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Core Content */}
      <section className="flex-1 flex flex-col justify-center items-center text-center max-w-4xl mx-auto py-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-900/5 text-gray-900 text-xs font-semibold mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Now Hardened with Upstash Rate Limiting
        </div>
        
        <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 tracking-tight leading-none mb-6">
          Hardened Authentication for <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500">
            Airtight Security.
          </span>
        </h1>
        
        <p className="text-base sm:text-lg text-gray-500 max-w-2xl mb-8 leading-relaxed">
          SecureGate provides standalone, production-ready credential management, single-use email verification tokens, rate-limited login attempts, and server-side middleware guards. Built to withstand malicious enumeration.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-xs sm:max-w-none">
          <Link
            href="/signup"
            className="bg-gray-900 text-white font-medium py-3 px-6 rounded-lg hover:bg-gray-700 transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]"
          >
            Create Secure Account
          </Link>
          <Link
            href="/login"
            className="bg-white border border-gray-300 text-gray-700 font-medium py-3 px-6 rounded-lg hover:bg-gray-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Access Dashboard
          </Link>
        </div>
      </section>

      {/* Brand Footer */}
      <footer className="text-center text-xs text-gray-400">
        &copy; {new Date().getFullYear()} SecureGate. Built with Next.js 14, TailwindCSS, and Prisma.
      </footer>
    </main>
  );
}
