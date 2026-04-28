import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabasePublicEnv, requireServerEnv } from "@/lib/env";
import { enforceRateLimit } from "@/lib/security";

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(2),
  business_name: z.string().optional(),
  phone: z.string().optional(),
});

export async function POST(request: Request) {
  if (!hasSupabasePublicEnv()) {
    return NextResponse.json(
      { error: "Supabase n'est pas configure." },
      { status: 503 },
    );
  }

  const ip = request.headers.get("x-forwarded-for") ?? "local";
  enforceRateLimit(`signup:${ip}`, 5, 10 * 60 * 1000);

  const body = await request.json();
  const parsed = signUpSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Certaines informations sont invalides." }, { status: 400 });
  }

  const supabase = await createClient();
  const env = requireServerEnv();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase n'est pas configure." }, { status: 503 });
  }
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.full_name,
        business_name: parsed.data.business_name,
        phone: parsed.data.phone,
      },
      emailRedirectTo: `${env.APP_URL ?? "http://localhost:3000"}/auth/callback?next=/onboarding`,
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (data.user?.id) {
    const admin = createAdminClient();
    await admin.from("profiles").upsert({
      id: data.user.id,
      email: parsed.data.email,
      full_name: parsed.data.full_name,
      business_name: parsed.data.business_name ?? null,
      phone: parsed.data.phone ?? null,
    });
  }

  return NextResponse.json({
    message:
      "Compte cree. Tu peux maintenant completer ton profil. Verifie aussi ton email si on te le demande.",
    redirectTo: data.session ? "/onboarding" : "/login",
  });
}
