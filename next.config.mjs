/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY", // Mitigates clickjacking attacks
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff", // Mitigates MIME sniffing attacks
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin", // Controls referrer leakages
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self';", // Content Security Policy
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload", // Enforces HSTS (TLS)
          },
        ],
      },
    ];
  },
};

export default nextConfig;
