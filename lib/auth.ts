import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabasePublicEnv } from "@/lib/env";
import { getPlanDefinition } from "@/lib/plans";
import type {
  ProfileRecord,
  QuotaSnapshot,
  SubscriptionRecord,
  ViewerRecord,
} from "@/lib/types";

export async function getViewer() {
  const supabase = await createClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [{ data: profile }, { data: subscription }] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .returns<ProfileRecord[]>()
      .single(),
    supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .returns<SubscriptionRecord[]>()
      .maybeSingle(),
  ]);

  return {
    user,
    profile,
    subscription,
  } satisfies ViewerRecord;
}

export async function requireUser() {
  if (!hasSupabasePublicEnv()) {
    redirect("/setup");
  }

  const viewer = await getViewer();

  if (!viewer?.user || !viewer.profile) {
    redirect("/login");
  }

  return viewer;
}

export async function requireOnboardedUser() {
  const viewer = await requireUser();

  if (!isProfileOnboardingComplete(viewer.profile)) {
    redirect("/onboarding");
  }

  return viewer;
}

export async function requireAdmin() {
  if (!hasSupabasePublicEnv()) {
    redirect("/setup");
  }

  const viewer = await requireUser();

  if (viewer.profile.role !== "admin") {
    redirect("/dashboard");
  }

  return viewer;
}

export function computeQuotaSnapshot(profile: ProfileRecord): QuotaSnapshot {
  const plan = getPlanDefinition(profile.plan_id);
  const monthlyRemaining = Math.max(plan.monthlyQuota - profile.quota_used, 0);
  const bonusCredits = Math.max(profile.bonus_credits ?? 0, 0);

  return {
    plan_id: plan.id,
    monthly_quota: plan.monthlyQuota,
    quota_used: profile.quota_used,
    bonus_credits: bonusCredits,
    quota_remaining: monthlyRemaining + bonusCredits,
    watermark_enabled: plan.watermark,
  };
}

export function isProfileOnboardingComplete(profile: ProfileRecord) {
  return Boolean(
    profile.onboarding_completed &&
      profile.business_name &&
      profile.business_category &&
      profile.city &&
      (profile.whatsapp_phone || profile.phone),
  );
}
