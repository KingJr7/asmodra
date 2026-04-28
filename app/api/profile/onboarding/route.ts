import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { hasSupabasePublicEnv } from "@/lib/env";
import { enforceRateLimit, sanitizeText } from "@/lib/security";

const onboardingSchema = z.object({
  full_name: z.string().min(2),
  business_name: z.string().min(2),
  business_category: z.string().min(2),
  city: z.string().min(2),
  phone: z.string().min(8),
  whatsapp_phone: z.string().optional(),
  brand_tone: z.string().min(2),
});

export async function POST(request: Request) {
  if (!hasSupabasePublicEnv()) {
    return NextResponse.json({ error: "Supabase n'est pas configure." }, { status: 503 });
  }

  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase n'est pas configure." }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  enforceRateLimit(`onboarding:${user.id}`, 10, 10 * 60 * 1000);

  const body = await request.json();
  const parsed = onboardingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Donnees onboarding invalides." }, { status: 400 });
  }

  const payload = {
    full_name: sanitizeText(parsed.data.full_name),
    business_name: sanitizeText(parsed.data.business_name),
    business_category: sanitizeText(parsed.data.business_category),
    city: sanitizeText(parsed.data.city),
    phone: sanitizeText(parsed.data.phone),
    whatsapp_phone: sanitizeText(parsed.data.whatsapp_phone ?? parsed.data.phone),
    brand_tone: sanitizeText(parsed.data.brand_tone),
    onboarding_completed: true,
  };

  const { error } = await supabase.from("profiles").update(payload).eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    message: "Profil business complete.",
    redirectTo: "/dashboard",
  });
}
