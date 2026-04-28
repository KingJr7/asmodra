import { createBrowserClient } from "@supabase/ssr";
import { hasSupabasePublicEnv, getPublicEnv } from "@/lib/env";

export function createClient() {
  if (!hasSupabasePublicEnv()) {
    return null;
  }

  const parsed = getPublicEnv();

  if (!parsed.success) {
    return null;
  }

  return createBrowserClient(
    parsed.data.NEXT_PUBLIC_SUPABASE_URL,
    parsed.data.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
