import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasSupabasePublicEnv } from "@/lib/env";

function safeInternalPath(value: string | null, fallback: string) {
  if (!value || !value.startsWith("/")) {
    return fallback;
  }

  return value;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const next = safeInternalPath(url.searchParams.get("next"), "/dashboard");

  if (!hasSupabasePublicEnv()) {
    return NextResponse.redirect(new URL("/setup", request.url));
  }

  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.redirect(new URL("/setup", request.url));
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(new URL("/login?authError=callback", request.url));
    }
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as
        | "signup"
        | "invite"
        | "magiclink"
        | "recovery"
        | "email_change"
        | "email",
    });

    if (error) {
      return NextResponse.redirect(new URL("/login?authError=otp", request.url));
    }
  }

  if (type === "recovery" || next === "/reset-password") {
    return NextResponse.redirect(new URL("/reset-password", request.url));
  }

  return NextResponse.redirect(new URL(next, request.url));
}
