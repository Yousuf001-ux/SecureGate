import { NextRequest } from "next/server";

/**
 * Extracts the true client IP from standard proxy headers (such as on Vercel),
 * falling back to local loops if headers are empty or missing.
 */
export function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  
  if (forwardedFor) {
    // x-forwarded-for can contain a comma-separated list of proxy IPs; 
    // the first entry is always the client's actual IP address.
    const firstIp = forwardedFor.split(",")[0].trim();
    if (firstIp) return firstIp;
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;

  return "127.0.0.1";
}
