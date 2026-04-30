import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    await requireAdmin();
    const admin = createAdminClient();

    const { data: generations } = await admin
      .from("generation_audits")
      .select(`
        id,
        created_at,
        model,
        metadata,
        user_id,
        profiles (email)
      `)
      .order("created_at", { ascending: false })
      .limit(50);

    return NextResponse.json(generations ?? []);
  } catch {
    return NextResponse.json({ error: "Unauthorized or server error" }, { status: 401 });
  }
}
