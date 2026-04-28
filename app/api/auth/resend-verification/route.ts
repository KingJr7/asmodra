import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { hasSupabasePublicEnv, requireServerEnv } from "@/lib/env";
import { enforceRateLimit } from "@/lib/security";

const resendSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  if (!hasSupabasePublicEnv()) {
    return NextResponse.json({ error: "Supabase n'est pas configure." }, { status: 503 });
  }

  const ip = request.headers.get("x-forwarded-for") ?? "local";
  enforceRateLimit(`resend-verification:${ip}`, 5, 10 * 60 * 1000);

  const body = await request.json();
  const parsed = resendSchema.safeParse(body);
  const env = requireServerEnv();

  if (!parsed.success) {
    return NextResponse.json({ error: "Email invalide." }, { status: 400 });
  }

  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase n'est pas configure." }, { status: 503 });
  }

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${env.APP_URL ?? "http://localhost:3000"}/auth/callback?next=/dashboard`,
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    message: "Email de verification renvoye si le compte existe.",
  });
}
