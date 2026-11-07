export function safeInternalPath(value: string | null | undefined, origin = window.location.origin) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/onboarding";
  try {
    const parsed = new URL(value, origin);
    if (parsed.origin !== origin) return "/onboarding";
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/onboarding";
  }
}
