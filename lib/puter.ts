import { requirePuterEnv } from "@/lib/env";
import type {
  GenerationFormat,
  GenerationRefinementQuestion,
  PromptOptimizationResult,
} from "@/lib/types";

type PuterClient = {
  ai: {
    chat: (...args: unknown[]) => Promise<unknown>;
  };
};

let puterClientPromise: Promise<PuterClient> | null = null;

async function getPuterClient() {
  if (!puterClientPromise) {
    puterClientPromise = (async () => {
      const env = requirePuterEnv();
      const puterInitModule = (await import("@heyputer/puter.js/src/init.cjs")) as {
        init: (authToken: string) => PuterClient;
      };
      return puterInitModule.init(env.PUTER_AUTH_TOKEN);
    })();
  }

  return puterClientPromise;
}

function toPuterError(error: unknown): Error {
  if (
    error &&
    typeof error === "object" &&
    "status" in error &&
    "message" in error &&
    typeof (error as { status: unknown }).status === "number" &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    const payload = error as { status: number; message: string };
    return new Error(`PUTER_ERROR:${payload.status}:${payload.message}`);
  }

  if (error instanceof Error) {
    return new Error(`PUTER_ERROR:${error.message}`);
  }

  return new Error("PUTER_ERROR:UNKNOWN");
}

async function puterChat(puter: PuterClient, ...args: unknown[]) {
  try {
    return await puter.ai.chat(...args);
  } catch (error) {
    throw toPuterError(error);
  }
}

function getAspectRatio(format: GenerationFormat) {
  if (format === "story") {
    return "9:16";
  }

  if (format === "print") {
    return "3:4";
  }

  return "1:1";
}

function parseJsonBlock<T>(value: string): T {
  const start = value.indexOf("{");
  const end = value.lastIndexOf("}");

  if (start === -1 || end === -1) {
    throw new Error("Puter response did not return JSON.");
  }

  return JSON.parse(value.slice(start, end + 1)) as T;
}

function extractTextContent(payload: unknown) {
  if (typeof payload === "string") {
    return payload;
  }

  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    payload.message &&
    typeof payload.message === "object" &&
    "content" in payload.message &&
    typeof payload.message.content === "string"
  ) {
    return payload.message.content;
  }

  throw new Error("Puter returned an invalid text payload.");
}

function extractImageDataUrl(payload: unknown) {
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    payload.message &&
    typeof payload.message === "object" &&
    "images" in payload.message &&
    Array.isArray(payload.message.images) &&
    payload.message.images[0] &&
    typeof payload.message.images[0] === "object" &&
    "image_url" in payload.message.images[0] &&
    payload.message.images[0].image_url &&
    typeof payload.message.images[0].image_url === "object" &&
    "url" in payload.message.images[0].image_url &&
    typeof payload.message.images[0].image_url.url === "string"
  ) {
    return payload.message.images[0].image_url.url;
  }

  throw new Error("No generated image returned by Puter.");
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

export async function optimizePromptWithPuter(input: {
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
  const env = requirePuterEnv();
  const puter = await getPuterClient();
  const response = await puterChat(
    puter,
    [
      {
        role: "system",
        content:
          [
            "You are an adaptive commercial creative strategist for AI-generated flyers.",
            "Return JSON only with keys: safety, rejection_reason, improved_prompt, short_title, social_caption, visual_strategy, audience_angle, layout_strategy, image_direction.",
            "safety must be allowed or blocked.",
            "Default language is French for flyer text content.",
            "If user brief is in another language, keep all flyer text in that same language.",
            "If user explicitly provides English fragments, keep those exact fragments in English.",
            "Correct spelling, accents, and grammar of visible flyer text; never propagate user typos as-is.",
            "Preserve factual values exactly (names, prices, dates, phone numbers, addresses) while correcting wording.",
            "Before finalizing improved_prompt, perform a strict copy-quality pass: spelling, grammar, punctuation, capitalization, and accent marks.",
            "Rewrite unclear or malformed text into professional wording without altering factual values.",
            "Use one main language unless user explicitly requests bilingual text.",
            "If mandatory_copy_points is provided, every critical item from that field must be represented. Never omit it.",
            "If user_dominant_color is provided, respect it absolutely.",
            "If refinement_answers are provided, follow them strictly as final client directives.",
            "The improved_prompt must be visually precise and commercial, with clear text overlay zones and print-ready quality.",
            "Never invent factual information not explicitly provided by the user.",
            "Do not add phone numbers, addresses, websites, social handles, prices, dates, or extra claims unless user provided them.",
            "Treat mandatory_copy_points as exact source of truth for essential facts; only fix spelling/typography without altering factual meaning.",
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
    {
      model: env.PUTER_PROMPT_MODEL,
      temperature: 0.45,
      max_tokens: 1400,
    },
  );

  const content = extractTextContent(response);
  return parseJsonBlock<PromptOptimizationResult>(content);
}

export async function generateRefinementQuestionsWithPuter(input: {
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
  const env = requirePuterEnv();
  const puter = await getPuterClient();
  const response = await puterChat(
    puter,
    [
      {
        role: "system",
        content:
          [
            "You are a French-speaking creative brief clarifier for flyer generation.",
            "Ask up to 10 high-impact questions only when needed.",
            "Prioritize missing factual data required for final flyer copy: phone, address, website, social handle, date, time, venue, exact offer, CTA.",
            "Return JSON only with one key: questions.",
            "Each question object must contain: id, prompt, type, placeholder, options.",
            "type is text or single_choice.",
            "For text: options must be empty.",
            "For single_choice: provide 3 to 6 clear options.",
            "Keep prompts short and actionable.",
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
    {
      model: env.PUTER_REFINEMENT_MODEL,
      temperature: 0.2,
      max_tokens: 700,
    },
  );

  const content = extractTextContent(response);
  return sanitizeRefinementQuestions(parseJsonBlock<unknown>(content));
}

export async function generateImageWithPuter(input: {
  finalPrompt: string;
  format: GenerationFormat;
  referenceImages?: string[];
}) {
  const env = requirePuterEnv();
  const puter = await getPuterClient();
  const options = {
    model: env.PUTER_IMAGE_MODEL,
    image_config: {
      aspect_ratio: getAspectRatio(input.format),
      image_size: "2K",
    },
  };

  const response =
    input.referenceImages && input.referenceImages.length > 0
      ? await puterChat(puter, input.finalPrompt, input.referenceImages, false, options)
      : await puterChat(puter, input.finalPrompt, options);

  return {
    imageDataUrl: extractImageDataUrl(response),
    raw: response,
  };
}
