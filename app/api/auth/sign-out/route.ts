import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ redirectTo: "/" });
  }
  await supabase.auth.signOut();
  return NextResponse.json({ redirectTo: "/" });
}
