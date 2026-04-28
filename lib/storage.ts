import { createAdminClient } from "@/lib/supabase/admin";
import { buildStoragePath } from "@/lib/security";

export async function uploadAsset(input: {
  userId: string;
  file: File;
  kind: "reference" | "example" | "output";
}) {
  const supabase = createAdminClient();
  const path = buildStoragePath(input.userId, input.kind, input.file.name);
  const buffer = Buffer.from(await input.file.arrayBuffer());

  const { error } = await supabase.storage
    .from("brand-assets")
    .upload(path, buffer, {
      contentType: input.file.type,
      upsert: false,
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  await supabase.from("assets").insert({
    user_id: input.userId,
    bucket: "brand-assets",
    path,
    mime_type: input.file.type,
    bytes: input.file.size,
    kind: input.kind,
  });

  return {
    path,
  };
}
