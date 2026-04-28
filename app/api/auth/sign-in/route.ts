import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { hasSupabasePublicEnv } from "@/lib/env";
import { enforceRateLimit } from "@/lib/security";
import type { ProfileRecord } from "@/lib/types";

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  if (!hasSupabasePublicEnv()) {
    return NextResponse.json(
      { error: "Supabase n'est pas configure." },
      { status: 503 },
    );
  }

  const ip = request.headers.get("x-forwarded-for") ?? "local";
  enforceRateLimit(`signin:${ip}`, 10, 10 * 60 * 1000);

  const body = await request.json();
  const parsed = signInSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Email ou mot de passe invalide." }, { status: 400 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase n'est pas configure." }, { status: 503 });
  }
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user?.id ?? "")
    .returns<ProfileRecord[]>()
    .maybeSingle();

  return NextResponse.json({
    message: "Connexion reussie.",
    redirectTo: profile?.onboarding_completed ? "/dashboard" : "/onboarding",
  });
}
