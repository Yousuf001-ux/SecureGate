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
    <main className="min-h-screen bg-gray-50 flex flex-col justify-between px-6 py-6">
      {/* Brand Header */}
      <header className="max-w-7xl w-full mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-base hover:rotate-12 transition-transform">
            SG
          </div>
          <span className="font-bold text-gray-900 text-lg tracking-tight">SecureGate</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="text-sm font-medium bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Core Content */}
      <section className="flex-1 flex flex-col justify-center items-center text-center max-w-4xl mx-auto py-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/5 text-gray-900 text-xs font-semibold mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Now Hardened with Upstash Rate Limiting
        </div>
        
        <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 tracking-tight leading-none mb-6">
          Hardened Authentication for <br />
          <span className="text-blue-600">
            Airtight Security.
          </span>
        </h1>
        
        <p className="text-base sm:text-lg text-gray-500 max-w-2xl mb-8 leading-relaxed">
          A hardened authentication layer with rate-limited login, single-use tokens, and server-side middleware guards.
        </p>

        <Link
          href="/signup"
          className="bg-blue-600 text-white font-medium py-3 px-8 rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]"
        >
          Get Started
        </Link>
      </section>

      {/* Brand Footer */}
      <footer className="text-center text-xs text-gray-400">
        &copy; {new Date().getFullYear()} SecureGate. Built with Next.js 14, TailwindCSS, and Prisma.
      </footer>
    </main>
  );
}
