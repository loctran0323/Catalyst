import type { NextConfig } from "next";
import {
  securityHeaders,
  strictTransportSecurityHeader,
} from "./src/lib/security-headers";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    const headers = [...securityHeaders];
    if (process.env.NODE_ENV === "production") {
      headers.push(strictTransportSecurityHeader);
    }
    return [{ source: "/:path*", headers }];
  },
};

export default nextConfig;
