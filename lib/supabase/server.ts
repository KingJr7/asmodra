import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { hasSupabasePublicEnv, getPublicEnv } from "@/lib/env";

export async function createClient() {
  if (!hasSupabasePublicEnv()) {
    return null;
  }

  const parsed = getPublicEnv();
  const cookieStore = await cookies();

  if (!parsed.success) {
    return null;
  }

  return createServerClient(
    parsed.data.NEXT_PUBLIC_SUPABASE_URL,
    parsed.data.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server components can't always mutate cookies during render.
          }
        },
      },
    },
  );
}
