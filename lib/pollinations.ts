import { requirePollinationsEnv } from "@/lib/env";
import type {
  GenerationFormat,
  GenerationRefinementQuestion,
  PromptOptimizationResult,
} from "@/lib/types";

type PollinationsChatMessage = {
  role: "system" | "assistant" | "user";
  content: string;
};

function getAspectRatio(format: GenerationFormat) {
  if (format === "story") {
    return { width: 1080, height: 1920 };
  }

  if (format === "print") {
    return { width: 1200, height: 1600 };
  }

  return { width: 1080, height: 1080 };
}

function parseJsonBlock<T>(value: string): T {
  const start = value.indexOf("{");
  const end = value.lastIndexOf("}");

  if (start === -1 || end === -1) {
    throw new Error("Pollinations response did not return JSON.");
  }

  return JSON.parse(value.slice(start, end + 1)) as T;
}

function sanitizeQuestionId(value: string, fallback: string) {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  return base || fallback;
}

function sanitizeRefinementQuestions(
  raw: unknown,
): { questions: GenerationRefinementQuestion[] } {
  if (!raw || typeof raw !== "object" || !("questions" in raw)) {
    return { questions: [] };
  }

  const payload = raw as { questions?: unknown };
  const list = Array.isArray(payload.questions) ? payload.questions : [];
  const questions: GenerationRefinementQuestion[] = [];

  for (const [index, item] of list.entries()) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const entry = item as Record<string, unknown>;
    const prompt =
      typeof entry.prompt === "string" ? entry.prompt.replace(/\s+/g, " ").trim() : "";
    const rawType = typeof entry.type === "string" ? entry.type.trim() : "";
    const type = rawType === "single_choice" ? "single_choice" : "text";
    const placeholder =
      typeof entry.placeholder === "string"
        ? entry.placeholder.trim()
        : "Exemple: donne un resultat concret, court et utile.";
    const options =
      type === "single_choice" && Array.isArray(entry.options)
        ? entry.options
            .filter((value): value is string => typeof value === "string")
            .map((value) => value.trim())
            .filter(Boolean)
            .slice(0, 8)
        : [];

    if (!prompt) {
      continue;
    }

    if (type === "single_choice" && options.length < 2) {
      continue;
    }

    questions.push({
      id: sanitizeQuestionId(
        typeof entry.id === "string" ? entry.id : "",
        `question-${index + 1}`,
      ),
      prompt,
      type,
      placeholder,
      options,
    });

    if (questions.length >= 10) {
      break;
    }
  }

  return { questions };
}

async function pollinationsChat(
  messages: PollinationsChatMessage[],
  config?: { max_tokens?: number; temperature?: number },
) {
  const env = requirePollinationsEnv();
  const response = await fetch(`${env.POLLINATIONS_TEXT_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.POLLINATIONS_TEXT_MODEL,
      messages,
      max_tokens: config?.max_tokens ?? 1200,
      temperature: config?.temperature ?? 0.4,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`POLLINATIONS_ERROR:${response.status}:${text}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("POLLINATIONS_ERROR:INVALID_TEXT_PAYLOAD");
  }

  return content;
}

export async function optimizePromptWithPollinations(input: {
  businessName?: string | null;
  businessCategory?: string | null;
  city?: string | null;
  brandTone?: string | null;
  product: string;
  idea: string;
  customPrompt?: string;
  mustDisplayInfo?: string;
  dominantColor?: string;
  refinementAnswers?: Array<{ question: string; answer: string }>;
  format: GenerationFormat;
  referenceImagesCount?: number;
  exampleImagesCount?: number;
}) {
  const content = await pollinationsChat(
    [
      {
        role: "system",
        content:
          [
            "You are an adaptive commercial creative strategist for AI-generated flyers.",
            "Return JSON only with keys: safety, rejection_reason, improved_prompt, short_title, social_caption, visual_strategy, audience_angle, layout_strategy, image_direction.",
            "safety must be allowed or blocked.",
            "Default language is French for flyer text.",
            "If user brief is in another language, keep all flyer text in that language.",
            "If user explicitly provides English text fragments, keep those exact fragments in English.",
            "Correct spelling and grammar in visible flyer text; do not propagate user typos.",
            "Preserve factual values exactly (names, dates, prices, phone numbers, addresses) when correcting wording.",
            "Before finalizing improved_prompt, do a strict copy-quality pass: spelling, grammar, punctuation, capitalization, and accent marks.",
            "Rewrite malformed copy into professional wording without changing factual values.",
            "Use one main language unless the user explicitly asks for bilingual text.",
            "If mandatory_copy_points exists, include all mandatory points in the final design intent.",
            "Never invent factual information not explicitly provided by the user.",
            "Do not add any phone number, address, website, social handle, price, date, promo rate, or contact info unless the user provided it.",
            "Use mandatory_copy_points as exact source of truth for essential facts; only correct spelling/typography without changing meaning.",
            "If dominant color is provided, respect it strictly.",
            "If refinement answers are provided, follow them strictly as final constraints.",
          ].join(" "),
      },
      {
        role: "user",
        content: JSON.stringify({
          business_name: input.businessName ?? null,
          business_category: input.businessCategory ?? null,
          city: input.city ?? null,
          brand_tone: input.brandTone ?? null,
          product_or_service: input.product,
          user_brief: input.idea,
          custom_prompt: input.customPrompt ?? null,
          mandatory_copy_points: input.mustDisplayInfo ?? null,
          user_dominant_color: input.dominantColor ?? null,
          refinement_answers: input.refinementAnswers ?? [],
          output_format: input.format,
          reference_images_count: input.referenceImagesCount ?? 0,
          example_images_count: input.exampleImagesCount ?? 0,
        }),
      },
    ],
    { max_tokens: 1400, temperature: 0.45 },
  );

  return parseJsonBlock<PromptOptimizationResult>(content);
}

export async function generateRefinementQuestionsWithPollinations(input: {
  businessName?: string | null;
  businessCategory?: string | null;
  city?: string | null;
  brandTone?: string | null;
  product: string;
  idea: string;
  customPrompt?: string;
  mustDisplayInfo?: string;
  dominantColor?: string;
  format: GenerationFormat;
}) {
  const content = await pollinationsChat(
    [
      {
        role: "system",
        content:
          [
            "You are a French-speaking creative brief clarifier for flyer generation.",
            "Ask up to 4 high-impact questions focusing EXCLUSIVELY on visual and textual content for the flyer.",
            "DO NOT ask about business activities, business models, or company details. Instead, ask for: flyer headlines, specific visual elements/imagery required, desired layout/style tone, exact CTA (Call to Action) wording, and essential copy points to display.",
            "Return JSON only with one key: questions (array of objects: id, prompt, type, placeholder, options).",
            "type is text or single_choice.",
            "Keep prompts short and actionable in French.",
          ].join(" "),
      },
      {
        role: "user",
        content: JSON.stringify({
          business_name: input.businessName ?? null,
          business_category: input.businessCategory ?? null,
          city: input.city ?? null,
          brand_tone: input.brandTone ?? null,
          product_or_service: input.product,
          user_brief: input.idea,
          custom_prompt: input.customPrompt ?? null,
          mandatory_copy_points: input.mustDisplayInfo ?? null,
          user_dominant_color: input.dominantColor ?? null,
          output_format: input.format,
        }),
      },
    ],
    { max_tokens: 700, temperature: 0.2 },
  );

  return sanitizeRefinementQuestions(parseJsonBlock<unknown>(content));
}

export async function generateImageWithPollinations(input: {
  finalPrompt: string;
  format: GenerationFormat;
  referenceImages?: string[];
}) {
  const env = requirePollinationsEnv();
  const { width, height } = getAspectRatio(input.format);
  const refs =
    input.referenceImages && input.referenceImages.length
      ? `\nReferences (describe and respect if possible): ${input.referenceImages.length} image(s) provided by user.`
      : "";
  const composedPrompt = `${input.finalPrompt}${refs}`;
  const url = new URL(
    `${env.POLLINATIONS_IMAGE_BASE_URL}/prompt/${encodeURIComponent(composedPrompt)}`,
  );
  url.searchParams.set("model", env.POLLINATIONS_IMAGE_MODEL);
  url.searchParams.set("width", String(width));
  url.searchParams.set("height", String(height));
  url.searchParams.set("nologo", "true");

  const response = await fetch(url.toString());
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`POLLINATIONS_ERROR:${response.status}:${text}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get("content-type") ?? "image/jpeg";
  return {
    imageDataUrl: `data:${contentType};base64,${bytes.toString("base64")}`,
    raw: null,
  };
}
