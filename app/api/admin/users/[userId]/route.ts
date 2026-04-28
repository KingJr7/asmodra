import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabasePublicEnv } from "@/lib/env";
import { PLAN_DEFINITIONS } from "@/lib/plans";

const adminUpdateSchema = z.object({
  role: z.enum(["user", "admin"]).optional(),
  plan_id: z.enum(["starter", "pro", "business"]).optional(),
  subscription_status: z.enum(["inactive", "pending", "active", "expired"]).optional(),
  onboarding_completed: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/admin/users/[userId]">,
) {
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

  const { data: actor } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: "user" | "admin" }>();

  if (actor?.role !== "admin") {
    return NextResponse.json({ error: "Acces admin requis." }, { status: 403 });
  }

  const { userId } = await context.params;
  const body = await request.json();
  const parsed = adminUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Payload admin invalide." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: currentProfile } = await admin
    .from("profiles")
    .select("plan_id")
    .eq("id", userId)
    .single<{ plan_id: "starter" | "pro" | "business" }>();
  const updates = parsed.data;

  if (updates.role || updates.plan_id || typeof updates.onboarding_completed === "boolean") {
    const profilePatch: Record<string, unknown> = {};

    if (updates.role) {
      profilePatch.role = updates.role;
    }

    if (updates.plan_id) {
      profilePatch.plan_id = updates.plan_id;
    }

    if (typeof updates.onboarding_completed === "boolean") {
      profilePatch.onboarding_completed = updates.onboarding_completed;
    }

    const { error } = await admin.from("profiles").update(profilePatch).eq("id", userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  if (updates.subscription_status || updates.plan_id) {
    const planId = updates.plan_id ?? currentProfile?.plan_id ?? PLAN_DEFINITIONS.starter.id;
    const { error } = await admin.from("subscriptions").upsert(
      {
        user_id: userId,
        plan_id: planId,
        status: updates.subscription_status ?? "active",
        started_at: new Date().toISOString(),
        renewed_manually: true,
      },
      {
        onConflict: "user_id",
        ignoreDuplicates: false,
      },
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  return NextResponse.json({ message: "Utilisateur mis a jour." });
}
