import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { hasSupabasePublicEnv, requireServerEnv } from "@/lib/env";
import { enforceRateLimit } from "@/lib/security";

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  if (!hasSupabasePublicEnv()) {
    return NextResponse.json({ error: "Supabase n'est pas configure." }, { status: 503 });
  }

  const ip = request.headers.get("x-forwarded-for") ?? "local";
  enforceRateLimit(`forgot-password:${ip}`, 5, 10 * 60 * 1000);

  const body = await request.json();
  const parsed = forgotPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Email invalide." }, { status: 400 });
  }

  const supabase = await createClient();
  const env = requireServerEnv();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase n'est pas configure." }, { status: 503 });
  }

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${env.APP_URL ?? "http://localhost:3000"}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    message: "Si ce compte existe, un email de reinitialisation a ete envoye.",
  });
}
