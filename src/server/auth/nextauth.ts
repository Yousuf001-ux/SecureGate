import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { findUserByEmail } from "../repositories/user.repo";
import { comparePassword } from "@/lib/bcrypt";
import { checkRateLimit } from "../services/rateLimit.service";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        // Resolve IP address from NextAuth request wrapper headers for sliding window rate limiting
        const headers = req?.headers as Record<string, string> | undefined;
        const forwardedFor = headers?.["x-forwarded-for"];
        let clientIp = "127.0.0.1";
        
        if (forwardedFor) {
          clientIp = forwardedFor.split(",")[0].trim();
        } else if (headers?.["x-real-ip"]) {
          clientIp = headers["x-real-ip"];
        }

        // 1. Rate Limit Attempt Check
        const isAllowed = await checkRateLimit(clientIp, "login");
        if (!isAllowed) {
          // Throws standard message for front-end catch
          throw new Error("Too many attempts. Please try again later.");
        }

        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        // 2. Fetch User Case-Insensitively
        const user = await findUserByEmail(credentials.email);
        if (!user) {
          // Prevent user enumeration: throw identical generic error
          throw new Error("Invalid credentials");
        }

        // 3. Verify Password Hash
        const isPasswordCorrect = await comparePassword(credentials.password, user.password);
        if (!isPasswordCorrect) {
          // Prevent user enumeration: throw identical generic error
          throw new Error("Invalid credentials");
        }

        // 4. Return Session User object.
        // We permit login for unverified accounts but keep emailVerified as null in their token/session.
        // This is a superior architecture to blocking them at authorize(): it lets unverified sessions 
        // render the `/verify-required` page cleanly, trigger resends, and manage their status, 
        // while the server-side middleware guarantees they can never access `/dashboard` or internal pages.
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt", // JWT stateless session strategy
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.emailVerified = (user as { emailVerified?: Date | null }).emailVerified;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const customUser = session.user as { id?: string; emailVerified?: Date | string | null };
        customUser.id = token.id as string;
        customUser.emailVerified = token.emailVerified as Date | string | null;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
