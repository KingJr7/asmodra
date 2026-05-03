import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertAllowedFile } from "@/lib/security";
import type { ReferenceImage, ReferenceKind } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase n'est pas configuré." },
        { status: 503 },
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }

    const url = new URL(request.url);
    const kind = url.searchParams.get("kind") as ReferenceKind | null;

    let query = supabase
      .from("reference_images")
      .select("id, user_id, kind, name, path, bytes, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (kind) {
      query = query.eq("kind", kind);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const references: ReferenceImage[] = (data ?? []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      kind: row.kind as ReferenceKind,
      name: row.name,
      path: row.path,
      bytes: row.bytes,
      createdAt: row.created_at,
    }));

    return NextResponse.json({ references });
  } catch (error) {
    console.error("[reference-images] GET failed", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase n'est pas configuré." },
        { status: 503 },
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const kind = formData.get("kind") as ReferenceKind | null;

    if (!file || !kind || !["logo", "product", "style_guide"].includes(kind)) {
      return NextResponse.json(
        { error: "Fichier et type de référence requis." },
        { status: 400 },
      );
    }

    assertAllowedFile(file);

    const admin = createAdminClient();
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-z0-9.-]/gi, "_");
    const path = `${user.id}/references/${kind}/${timestamp}-${sanitizedName}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await admin.storage
      .from("brand-assets")
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Erreur d'upload: ${uploadError.message}` },
        { status: 500 },
      );
    }

    const { data: inserted, error: insertError } = await admin
      .from("reference_images")
      .insert({
        user_id: user.id,
        kind,
        name: file.name,
        path,
        bytes: file.size,
      })
      .select("id, user_id, kind, name, path, bytes, created_at")
      .single();

    if (insertError) {
      await admin.storage.from("brand-assets").remove([path]);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const reference: ReferenceImage = {
      id: inserted.id,
      userId: inserted.user_id,
      kind: inserted.kind as ReferenceKind,
      name: inserted.name,
      path: inserted.path,
      bytes: inserted.bytes,
      createdAt: inserted.created_at,
    };

    return NextResponse.json({ reference }, { status: 201 });
  } catch (error) {
    console.error("[reference-images] POST failed", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 },
    );
  }
}
