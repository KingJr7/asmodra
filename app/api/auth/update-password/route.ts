import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { hasSupabasePublicEnv } from "@/lib/env";

const updatePasswordSchema = z.object({
  password: z.string().min(8),
});

export async function POST(request: Request) {
  if (!hasSupabasePublicEnv()) {
    return NextResponse.json({ error: "Supabase n'est pas configure." }, { status: 503 });
  }

  const body = await request.json();
  const parsed = updatePasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Mot de passe invalide." }, { status: 400 });
  }

  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase n'est pas configure." }, { status: 503 });
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    message: "Mot de passe mis a jour.",
    redirectTo: "/dashboard",
  });
}
