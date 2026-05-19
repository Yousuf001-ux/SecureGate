/**
 * Standard secure headers configuration for the SecureGate application.
 * Mitigates common attacks like Clickjacking, MIME Sniffing, XSS, and Referrer leakage.
 */
export const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "DENY", // Clickjacking mitigation
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff", // MIME sniffing mitigation
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin", // Protects referrer privacy
  },
  {
    key: "Content-Security-Policy",
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self';", // Restricts resource loading to self
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload", // Enforces TLS server-wide
  },
];
