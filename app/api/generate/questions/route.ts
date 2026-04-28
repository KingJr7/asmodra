import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateRefinementQuestions } from "@/lib/openrouter";
import { generateRefinementQuestionsWithPuter } from "@/lib/puter";
import { generateRefinementQuestionsWithPollinations } from "@/lib/pollinations";
import { enforceRateLimit, sanitizeMultiline, sanitizeText } from "@/lib/security";
import { getAiProvider } from "@/lib/ai-provider";
import type { GenerationFormat, ProfileRecord } from "@/lib/types";

const allowedFormats: GenerationFormat[] = ["square", "story", "print"];

function buildErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Impossible de preparer les questions.";

  if (message === "RATE_LIMITED") {
    return NextResponse.json(
      { error: "Trop de tentatives. Attends un peu puis reessaie." },
      { status: 429 },
    );
  }

  if (message.startsWith("OPENROUTER_ERROR:")) {
    return NextResponse.json({ error: message }, { status: 502 });
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
    return NextResponse.json({ error: message }, { status: 502 });
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
    return NextResponse.json({ error: message }, { status: 502 });
  }

  if (message.startsWith("Pollinations environment is incomplete:")) {
    return NextResponse.json(
      { error: "Pollinations n'est pas configure correctement dans .env.local." },
      { status: 503 },
    );
  }

  return NextResponse.json({ error: message }, { status: 500 });
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase n'est pas configure." }, { status: 503 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }

    enforceRateLimit(`generate-questions:${user.id}`, 12, 10 * 60 * 1000);

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .returns<ProfileRecord[]>()
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profil introuvable." }, { status: 404 });
    }

    const formData = await request.formData();
    const product = sanitizeText(formData.get("product"));
    const idea = sanitizeMultiline(formData.get("idea"));
    const customPrompt = sanitizeMultiline(formData.get("custom_prompt"));
    const mustDisplayInfo = sanitizeMultiline(formData.get("must_display_info"));
    const dominantColor = sanitizeText(formData.get("dominant_color"));
    const format = sanitizeText(formData.get("format")) as GenerationFormat;

    if (!product || !idea || !allowedFormats.includes(format)) {
      return NextResponse.json(
        { error: "Les champs de generation sont invalides." },
        { status: 400 },
      );
    }

    const provider = getAiProvider();
    const result =
      provider === "puter"
        ? await generateRefinementQuestionsWithPuter({
            businessName: profile.business_name,
            businessCategory: profile.business_category,
            city: profile.city,
            brandTone: profile.brand_tone,
            product,
            idea,
            customPrompt,
            mustDisplayInfo,
            dominantColor,
            format,
          })
        : provider === "pollinations"
          ? await generateRefinementQuestionsWithPollinations({
              businessName: profile.business_name,
              businessCategory: profile.business_category,
              city: profile.city,
              brandTone: profile.brand_tone,
              product,
              idea,
              customPrompt,
              mustDisplayInfo,
              dominantColor,
              format,
            })
        : await generateRefinementQuestions({
            businessName: profile.business_name,
            businessCategory: profile.business_category,
            city: profile.city,
            brandTone: profile.brand_tone,
            product,
            idea,
            customPrompt,
            mustDisplayInfo,
            dominantColor,
            format,
          });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[generate/questions] request failed", error);
    return buildErrorResponse(error);
  }
}
