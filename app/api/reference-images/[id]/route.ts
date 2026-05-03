import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

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

    const admin = createAdminClient();

    // Verify ownership
    const { data: reference, error: queryError } = await admin
      .from("reference_images")
      .select("path")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (queryError || !reference) {
      return NextResponse.json(
        { error: "Référence introuvable." },
        { status: 404 },
      );
    }

    // Delete from storage
    const { error: storageError } = await admin.storage
      .from("brand-assets")
      .remove([reference.path]);

    if (storageError) {
      console.error("[reference-images] storage delete failed", storageError);
      return NextResponse.json(
        { error: "Erreur lors de la suppression." },
        { status: 500 },
      );
    }

    // Delete from DB
    const { error: dbError } = await admin
      .from("reference_images")
      .delete()
      .eq("id", id);

    if (dbError) {
      console.error("[reference-images] DB delete failed", dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[reference-images delete] failed", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 },
    );
  }
}
