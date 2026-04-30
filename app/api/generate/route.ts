import { NextResponse } from "next/server";
import sharp from "sharp";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { applyWatermark, generateImage, optimizePrompt } from "@/lib/openrouter";
import {
  generateImageWithPuter,
  optimizePromptWithPuter,
} from "@/lib/puter";
import {
  generateImageWithPollinations,
  optimizePromptWithPollinations,
} from "@/lib/pollinations";
import {
  assertAllowedFile,
  enforceRateLimit,
  hashString,
  sanitizeMultiline,
  sanitizeText,
} from "@/lib/security";
import { getAiProvider } from "@/lib/ai-provider";
import { getPlanDefinition } from "@/lib/plans";
import { uploadAsset } from "@/lib/storage";
import { computeCreditsCost } from "@/lib/credits";
import type { GenerationFormat, ProfileRecord } from "@/lib/types";

const allowedFormats: GenerationFormat[] = ["square", "story", "print"];

async function imageDataUrlOrHttpToBuffer(value: string) {
  if (value.startsWith("data:")) {
    const base64 = value.split(",")[1] ?? "";
    if (!base64) {
      throw new Error("EMPTY_IMAGE_DATA_URL");
    }
    return Buffer.from(base64, "base64");
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    const response = await fetch(value);
    if (!response.ok) {
      throw new Error(`IMAGE_DOWNLOAD_FAILED:${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  throw new Error("UNSUPPORTED_IMAGE_PAYLOAD");
}

function parseRefinementAnswers(raw: string) {
  if (!raw.trim()) {
    return [] as Array<{ question: string; answer: string }>;
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw) as unknown;
  } catch {
    throw new Error("INVALID_REFINEMENT_ANSWERS");
  }
  if (!Array.isArray(payload)) {
    throw new Error("INVALID_REFINEMENT_ANSWERS");
  }

  return payload
    .filter(
      (entry): entry is { question: string; answer: string } =>
        Boolean(
          entry &&
            typeof entry === "object" &&
            "question" in entry &&
            "answer" in entry &&
            typeof (entry as { question: unknown }).question === "string" &&
            typeof (entry as { answer: unknown }).answer === "string",
        ),
    )
    .map((entry) => ({
      question: entry.question.replace(/\s+/g, " ").trim(),
      answer: entry.answer.replace(/\s+/g, " ").trim(),
    }))
    .filter((entry) => entry.question && entry.answer)
    .slice(0, 10);
}

function buildGenerateErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Generation impossible.";

  if (message === "RATE_LIMITED") {
    return NextResponse.json(
      { error: "Trop de tentatives. Attends un peu puis reessaie." },
      { status: 429 },
    );
  }

  if (message === "INVALID_FILE_TYPE") {
    return NextResponse.json(
      { error: "Format d'image non accepte. Utilise PNG, JPG ou WEBP." },
      { status: 400 },
    );
  }

  if (message === "FILE_TOO_LARGE") {
    return NextResponse.json(
      { error: "Une image est trop lourde. Reste sous 8 Mo par fichier." },
      { status: 400 },
    );
  }

  if (message === "INVALID_REFINEMENT_ANSWERS") {
    return NextResponse.json(
      { error: "Les reponses d'affinage envoyees sont invalides." },
      { status: 400 },
    );
  }

  if (message.startsWith("Storage upload failed:")) {
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }

  if (message.startsWith("OPENROUTER_ERROR:")) {
    return NextResponse.json(
      { error: message },
      { status: 502 },
    );
  }

  if (message.startsWith("PUTER_ERROR:401:")) {
    return NextResponse.json(
      {
        error:
          "Puter a refuse l'authentification (401). Verifie PUTER_AUTH_TOKEN dans .env.local.",
      },
      { status: 503 },
    );
  }

  if (message.startsWith("PUTER_ERROR:")) {
    return NextResponse.json(
      { error: message },
      { status: 502 },
    );
  }

  if (message.startsWith("OpenRouter environment is incomplete:")) {
    return NextResponse.json(
      { error: "OpenRouter n'est pas configure: ajoute OPENROUTER_API_KEY dans .env.local." },
      { status: 503 },
    );
  }

  if (message.startsWith("Puter environment is incomplete:")) {
    return NextResponse.json(
      { error: "Puter n'est pas configure: ajoute PUTER_AUTH_TOKEN dans .env.local." },
      { status: 503 },
    );
  }

  if (message.startsWith("POLLINATIONS_ERROR:")) {
    return NextResponse.json(
      { error: message },
      { status: 502 },
    );
  }

  if (message.startsWith("Pollinations environment is incomplete:")) {
    return NextResponse.json(
      { error: "Pollinations n'est pas configure correctement dans .env.local." },
      { status: 503 },
    );
  }

  if (
    message.includes("bucket") ||
    message.includes("Bucket") ||
    message.includes("brand-assets")
  ) {
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }

  return NextResponse.json({ error: message }, { status: 500 });
}

export async function POST(request: Request) {
  let reservationId: string | null = null;

  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase n'est pas configure." },
        { status: 503 },
      );
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }

    enforceRateLimit(`generate:${user.id}`, 8, 10 * 60 * 1000);

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .returns<ProfileRecord[]>()
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profil introuvable." }, { status: 404 });
    }

    const admin = createAdminClient();
    const { data: resetProfile } = await admin.rpc("reset_quota_if_needed", {
      p_user_id: user.id,
    });
    const effectiveProfile = (resetProfile as ProfileRecord | null) ?? profile;
    const plan = getPlanDefinition(effectiveProfile.plan_id);

    const formData = await request.formData();
    const product = sanitizeText(formData.get("product"));
    const idea = sanitizeMultiline(formData.get("idea"));
    const customPrompt = sanitizeMultiline(formData.get("custom_prompt"));
    const mustDisplayInfo = sanitizeMultiline(formData.get("must_display_info"));
    const dominantColor = sanitizeText(formData.get("dominant_color"));
    const format = sanitizeText(formData.get("format")) as GenerationFormat;
    const refinementAnswersRaw = sanitizeMultiline(formData.get("refinement_answers"));
    const refinementAnswers = parseRefinementAnswers(refinementAnswersRaw);

    if (!product || !idea || !allowedFormats.includes(format)) {
      return NextResponse.json(
        { error: "Les champs de generation sont invalides." },
        { status: 400 },
      );
    }

    const references = formData
      .getAll("references")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);
    const examples = formData
      .getAll("examples")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    const totalUploadBytes = [...references, ...examples].reduce(
      (sum, file) => sum + file.size,
      0,
    );
    const creditsCost = computeCreditsCost({
      format,
      referencesCount: references.length,
      examplesCount: examples.length,
      totalUploadBytes,
      hasCustomPrompt: Boolean(customPrompt.trim()),
    });
    const { data: reservationData, error: reservationError } = await admin.rpc(
      "reserve_generation_quota",
      {
        p_user_id: user.id,
        p_credits_cost: creditsCost.total,
      },
    );

    if (reservationError) {
      return NextResponse.json(
        {
          error:
            reservationError.message === "QUOTA_EXCEEDED"
              ? "Credits insuffisants."
              : reservationError.message,
        },
        { status: reservationError.message === "QUOTA_EXCEEDED" ? 400 : 500 },
      );
    }

    reservationId = reservationData?.[0]?.reservation_id ?? null;

    if (!reservationId) {
      return NextResponse.json(
        { error: "RESERVATION_ERROR: reservation introuvable." },
        { status: 500 },
      );
    }

    const referenceDataUrls: string[] = [];

    for (const file of [...references, ...examples]) {
      assertAllowedFile(file);
      const buffer = Buffer.from(await file.arrayBuffer());
      referenceDataUrls.push(`data:${file.type};base64,${buffer.toString("base64")}`);
      await uploadAsset({
        userId: user.id,
        file,
        kind: references.includes(file) ? "reference" : "example",
      });
    }

    const provider = getAiProvider();
    const optimized = await (provider === "puter"
      ? optimizePromptWithPuter({
          businessName: effectiveProfile.business_name,
          businessCategory: effectiveProfile.business_category,
          city: effectiveProfile.city,
          brandTone: effectiveProfile.brand_tone,
          product,
          idea,
          customPrompt,
          mustDisplayInfo,
          dominantColor,
          refinementAnswers,
          format,
          referenceImagesCount: references.length,
          exampleImagesCount: examples.length,
        })
      : provider === "pollinations"
        ? optimizePromptWithPollinations({
            businessName: effectiveProfile.business_name,
            businessCategory: effectiveProfile.business_category,
            city: effectiveProfile.city,
            brandTone: effectiveProfile.brand_tone,
            product,
            idea,
            customPrompt,
            mustDisplayInfo,
            dominantColor,
            refinementAnswers,
            format,
            referenceImagesCount: references.length,
            exampleImagesCount: examples.length,
          })
        : optimizePrompt({
          businessName: effectiveProfile.business_name,
          businessCategory: effectiveProfile.business_category,
          city: effectiveProfile.city,
          brandTone: effectiveProfile.brand_tone,
          product,
          idea,
          customPrompt,
          mustDisplayInfo,
          dominantColor,
          refinementAnswers,
          format,
          referenceImagesCount: references.length,
          exampleImagesCount: examples.length,
        }));

    if (optimized.safety === "blocked") {
      const { error: cancelError } = await admin.rpc("cancel_generation_reservation", {
        p_reservation_id: reservationId,
        p_reason: "SAFETY_BLOCKED",
      });
      if (cancelError) {
        console.error("[generate] reservation cancel failed", cancelError);
      }
      reservationId = null;
      return NextResponse.json(
        {
          error:
            optimized.rejection_reason ??
            "Le prompt a ete bloque par la politique de securite.",
        },
        { status: 400 },
      );
    }

    const generated: {
      imageDataUrl: unknown;
      raw: unknown;
      usage?: Record<string, unknown> | undefined;
    } =
      provider === "puter"
        ? await generateImageWithPuter({
            finalPrompt: optimized.improved_prompt,
            format,
            referenceImages: referenceDataUrls,
          })
        : provider === "pollinations"
          ? await generateImageWithPollinations({
              finalPrompt: optimized.improved_prompt,
              format,
              referenceImages: referenceDataUrls,
            })
          : await generateImage({
              finalPrompt: optimized.improved_prompt,
              format,
              referenceImages: referenceDataUrls,
            });

    const finalImage = plan.watermark
      ? await applyWatermark(generated.imageDataUrl as string)
      : (generated.imageDataUrl as string);

    const rawOutputBuffer = await imageDataUrlOrHttpToBuffer(finalImage);
    const outputBuffer = await sharp(rawOutputBuffer)
      .resize({ width: 1600, withoutEnlargement: true })
      .png({ compressionLevel: 9, quality: 78, palette: true, effort: 8 })
      .toBuffer();
    const outputDataUrl = `data:image/png;base64,${outputBuffer.toString("base64")}`;
    const outputPath = `${user.id}/output/${Date.now()}-${hashString(product).slice(0, 12)}.png`;

    const { error: uploadError } = await admin.storage
      .from("brand-assets")
      .upload(outputPath, outputBuffer, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      const { error: cancelError } = await admin.rpc("cancel_generation_reservation", {
        p_reservation_id: reservationId,
        p_reason: "OUTPUT_UPLOAD_FAILED",
      });
      if (cancelError) {
        console.error("[generate] reservation cancel failed", cancelError);
      }
      reservationId = null;
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { error: outputAssetInsertError } = await admin.from("assets").insert({
      user_id: user.id,
      bucket: "brand-assets",
      path: outputPath,
      mime_type: "image/png",
      bytes: outputBuffer.byteLength,
      kind: "output",
    });

    if (outputAssetInsertError) {
      const { error: cancelError } = await admin.rpc("cancel_generation_reservation", {
        p_reservation_id: reservationId,
        p_reason: "OUTPUT_ASSET_INSERT_FAILED",
      });
      if (cancelError) {
        console.error("[generate] reservation cancel failed", cancelError);
      }
      reservationId = null;
      return NextResponse.json({ error: outputAssetInsertError.message }, { status: 500 });
    }

    const sourcePrompt = [
      product,
      idea,
      customPrompt,
      mustDisplayInfo ? `Infos obligatoires: ${mustDisplayInfo}` : "",
      dominantColor ? `Couleur dominante: ${dominantColor}` : "",
      ...refinementAnswers.map(
        (entry, index) => `Reponse QA ${index + 1}: ${entry.question} -> ${entry.answer}`,
      ),
    ]
      .filter(Boolean)
      .join("\n\n");
    const { data: quotaResult, error: quotaError } = await admin.rpc(
      "finalize_generation_reservation",
      {
        p_reservation_id: reservationId,
        p_format: format,
        p_model:
          provider === "puter"
            ? process.env.PUTER_IMAGE_MODEL ?? "gpt-image-1-mini"
            : provider === "pollinations"
              ? process.env.POLLINATIONS_IMAGE_MODEL ?? "flux"
            : process.env.OPENROUTER_IMAGE_MODEL ?? "openai/gpt-5-image-mini",
        p_prompt_hash: hashString(sourcePrompt),
        p_source_prompt: sourcePrompt,
        p_improved_prompt: optimized.improved_prompt,
        p_output_asset_path: outputPath,
        p_safety_decision: optimized.safety,
        p_metadata: {
          title: optimized.short_title,
          caption: optimized.social_caption,
          usage: generated.usage,
          reference_count: referenceDataUrls.length,
          examples_count: examples.length,
          upload_bytes: totalUploadBytes,
          credits_cost_breakdown: creditsCost,
          visual_strategy: optimized.visual_strategy,
          audience_angle: optimized.audience_angle,
          layout_strategy: optimized.layout_strategy,
            image_direction: optimized.image_direction,
            must_display_info: mustDisplayInfo || null,
            dominant_color: dominantColor || null,
            refinement_answers: refinementAnswers,
          },
      },
    );

    if (quotaError) {
      const { error: cancelError } = await admin.rpc("cancel_generation_reservation", {
        p_reservation_id: reservationId,
        p_reason: "FINALIZE_FAILED",
      });
      if (cancelError) {
        console.error("[generate] reservation cancel failed", cancelError);
      }
      reservationId = null;
      return NextResponse.json({ error: quotaError.message }, { status: 500 });
    }
    reservationId = null;

    return NextResponse.json({
      imageDataUrl: outputDataUrl,
      title: optimized.short_title,
      caption: optimized.social_caption,
      improvedPrompt: optimized.improved_prompt,
      quotaRemaining: quotaResult?.[0]?.quota_remaining ?? 0,
      creditsCost: quotaResult?.[0]?.credits_cost ?? creditsCost.total,
      creditsCostBreakdown: creditsCost,
      watermarkApplied: plan.watermark,
      visualStrategy: optimized.visual_strategy,
      audienceAngle: optimized.audience_angle,
      layoutStrategy: optimized.layout_strategy,
      imageDirection: optimized.image_direction,
      statusLabel:
        `Generation terminee. ${quotaResult?.[0]?.credits_cost ?? creditsCost.total} credits consommes.`,
    });
  } catch (error) {
    if (reservationId) {
      const admin = createAdminClient();
      const { error: cancelError } = await admin.rpc("cancel_generation_reservation", {
        p_reservation_id: reservationId,
        p_reason: "REQUEST_FAILED",
      });
      if (cancelError) {
        console.error("[generate] reservation cancel failed", cancelError);
      }
    }
    console.error("[generate] request failed", error);
    return buildGenerateErrorResponse(error);
  }
}
