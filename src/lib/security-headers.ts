/**
 * Applied via next.config `headers` for HTML/API responses.
 * CSP is intentionally omitted — Next.js + inline hydration makes a strict CSP easy to break;
 * tighten later with nonces if you need it.
 */
export const securityHeaders: { key: string; value: string }[] = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

/** HSTS: only meaningful on HTTPS (e.g. Vercel production). */
export const strictTransportSecurityHeader = {
  key: "Strict-Transport-Security",
  value: "max-age=31536000; includeSubDomains; preload",
};
