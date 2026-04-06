/**
 * Reduces open-redirect risk after OAuth/email magic link.
 * Only same-site paths under /home or /dashboard/*.
 */
export function safeAuthRedirectPath(raw: string | null): string {
  if (raw == null || typeof raw !== "string") return "/home";
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return "/home";
  if (trimmed.includes("://") || trimmed.includes("\\") || trimmed.includes("%2f%2f")) {
    return "/home";
  }
  const pathOnly = trimmed.split("?")[0]!.split("#")[0]!;
  if (pathOnly.includes("..")) return "/home";
  if (pathOnly === "/home") return "/home";
  if (pathOnly === "/dashboard" || pathOnly.startsWith("/dashboard/")) return pathOnly;
  return "/home";
}
