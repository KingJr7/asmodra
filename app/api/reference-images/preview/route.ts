import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const { path } = await request.json() as { path?: string };

    if (!path) {
      return NextResponse.json(
        { error: "Path requis." },
        { status: 400 },
      );
    }

    const admin = createAdminClient();

    const { data: signed, error } = await admin.storage
      .from("brand-assets")
      .createSignedUrl(path, 60 * 60 * 24); // 24 hours

    if (error || !signed?.signedUrl) {
      return NextResponse.json(
        { error: "Impossible de générer l'URL de preview." },
        { status: 500 },
      );
    }

    return NextResponse.json({ signedUrl: signed.signedUrl });
  } catch (error) {
    console.error("[preview] failed", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 },
    );
  }
}
