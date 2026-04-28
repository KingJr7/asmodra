import { z } from "zod";

const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  OPENROUTER_API_KEY: z.string().min(1).optional(),
  OPENROUTER_PROMPT_MODEL: z.string().min(1).default("openai/gpt-4.1-mini"),
  OPENROUTER_REFINEMENT_MODEL: z
    .string()
    .min(1)
    .default("openai/gpt-4.1-mini"),
  OPENROUTER_IMAGE_MODEL: z
    .string()
    .min(1)
    .default("openai/gpt-5-image-mini"),
  AI_PROVIDER: z.enum(["openrouter", "puter", "pollinations"]).default("openrouter"),
  PUTER_AUTH_TOKEN: z.string().min(1).optional(),
  PUTER_PROMPT_MODEL: z.string().min(1).default("gpt-5.4-nano"),
  PUTER_REFINEMENT_MODEL: z.string().min(1).default("gpt-5.4"),
  PUTER_IMAGE_MODEL: z.string().min(1).default("gpt-image-1-mini"),
  POLLINATIONS_TEXT_MODEL: z.string().min(1).default("openai-fast"),
  POLLINATIONS_IMAGE_MODEL: z.string().min(1).default("flux"),
  POLLINATIONS_TEXT_BASE_URL: z
    .string()
    .url()
    .default("https://text.pollinations.ai/openai/v1"),
  POLLINATIONS_IMAGE_BASE_URL: z
    .string()
    .url()
    .default("https://image.pollinations.ai"),
  YABETOO_SECRET_KEY: z.string().min(1),
  YABETOO_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_YABETOO_BASE_URL: z.string().url().optional(),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),
  CRON_SECRET: z.string().min(1),
  APP_URL: z.string().url().optional(),
});

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

function getRawServerEnv() {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    OPENROUTER_PROMPT_MODEL: process.env.OPENROUTER_PROMPT_MODEL,
    OPENROUTER_REFINEMENT_MODEL: process.env.OPENROUTER_REFINEMENT_MODEL,
    OPENROUTER_IMAGE_MODEL: process.env.OPENROUTER_IMAGE_MODEL,
    AI_PROVIDER: process.env.AI_PROVIDER,
    PUTER_AUTH_TOKEN: process.env.PUTER_AUTH_TOKEN,
    PUTER_PROMPT_MODEL: process.env.PUTER_PROMPT_MODEL,
    PUTER_REFINEMENT_MODEL: process.env.PUTER_REFINEMENT_MODEL,
    PUTER_IMAGE_MODEL: process.env.PUTER_IMAGE_MODEL,
    POLLINATIONS_TEXT_MODEL: process.env.POLLINATIONS_TEXT_MODEL,
    POLLINATIONS_IMAGE_MODEL: process.env.POLLINATIONS_IMAGE_MODEL,
    POLLINATIONS_TEXT_BASE_URL: process.env.POLLINATIONS_TEXT_BASE_URL,
    POLLINATIONS_IMAGE_BASE_URL: process.env.POLLINATIONS_IMAGE_BASE_URL,
    YABETOO_SECRET_KEY: process.env.YABETOO_SECRET_KEY,
    YABETOO_WEBHOOK_SECRET: process.env.YABETOO_WEBHOOK_SECRET,
    NEXT_PUBLIC_YABETOO_BASE_URL: process.env.NEXT_PUBLIC_YABETOO_BASE_URL,
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
    CRON_SECRET: process.env.CRON_SECRET,
    APP_URL: process.env.APP_URL,
  };
}

function getRawPublicEnv() {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  };
}

export function getPublicEnv() {
  return publicEnvSchema.safeParse(getRawPublicEnv());
}

export function hasSupabasePublicEnv() {
  return getPublicEnv().success;
}

export function getServerEnv() {
  return serverEnvSchema.safeParse(getRawServerEnv());
}

export function requireServerEnv() {
  const parsed = getServerEnv();

  if (!parsed.success) {
    throw new Error(
      `Server environment is incomplete: ${parsed.error.issues
        .map((issue) => issue.path.join("."))
        .join(", ")}`,
    );
  }

  return parsed.data;
}

export function isServerConfigured() {
  return getServerEnv().success;
}

const openRouterEnvSchema = z.object({
  OPENROUTER_API_KEY: z.string().min(1),
  OPENROUTER_PROMPT_MODEL: z.string().min(1).default("openai/gpt-4.1-mini"),
  OPENROUTER_REFINEMENT_MODEL: z
    .string()
    .min(1)
    .default("openai/gpt-4.1-mini"),
  OPENROUTER_IMAGE_MODEL: z.string().min(1).default("openai/gpt-5-image-mini"),
  APP_URL: z.string().url().optional(),
});

export function requireOpenRouterEnv() {
  const parsed = openRouterEnvSchema.safeParse({
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    OPENROUTER_PROMPT_MODEL: process.env.OPENROUTER_PROMPT_MODEL,
    OPENROUTER_REFINEMENT_MODEL: process.env.OPENROUTER_REFINEMENT_MODEL,
    OPENROUTER_IMAGE_MODEL: process.env.OPENROUTER_IMAGE_MODEL,
    APP_URL: process.env.APP_URL,
  });

  if (!parsed.success) {
    throw new Error(
      `OpenRouter environment is incomplete: ${parsed.error.issues
        .map((issue) => issue.path.join("."))
        .join(", ")}`,
    );
  }

  return parsed.data;
}

const puterEnvSchema = z.object({
  PUTER_AUTH_TOKEN: z.string().min(1),
  PUTER_PROMPT_MODEL: z.string().min(1).default("gpt-5.4-nano"),
  PUTER_REFINEMENT_MODEL: z.string().min(1).default("gpt-5.4"),
  PUTER_IMAGE_MODEL: z.string().min(1).default("gpt-image-1-mini"),
});

export function requirePuterEnv() {
  const parsed = puterEnvSchema.safeParse({
    PUTER_AUTH_TOKEN: process.env.PUTER_AUTH_TOKEN,
    PUTER_PROMPT_MODEL: process.env.PUTER_PROMPT_MODEL,
    PUTER_REFINEMENT_MODEL: process.env.PUTER_REFINEMENT_MODEL,
    PUTER_IMAGE_MODEL: process.env.PUTER_IMAGE_MODEL,
  });

  if (!parsed.success) {
    throw new Error(
      `Puter environment is incomplete: ${parsed.error.issues
        .map((issue) => issue.path.join("."))
        .join(", ")}`,
    );
  }

  return parsed.data;
}

const pollinationsEnvSchema = z.object({
  POLLINATIONS_TEXT_MODEL: z.string().min(1).default("openai-fast"),
  POLLINATIONS_IMAGE_MODEL: z.string().min(1).default("flux"),
  POLLINATIONS_TEXT_BASE_URL: z
    .string()
    .url()
    .default("https://text.pollinations.ai/openai/v1"),
  POLLINATIONS_IMAGE_BASE_URL: z
    .string()
    .url()
    .default("https://image.pollinations.ai"),
});

export function requirePollinationsEnv() {
  const parsed = pollinationsEnvSchema.safeParse({
    POLLINATIONS_TEXT_MODEL: process.env.POLLINATIONS_TEXT_MODEL,
    POLLINATIONS_IMAGE_MODEL: process.env.POLLINATIONS_IMAGE_MODEL,
    POLLINATIONS_TEXT_BASE_URL: process.env.POLLINATIONS_TEXT_BASE_URL,
    POLLINATIONS_IMAGE_BASE_URL: process.env.POLLINATIONS_IMAGE_BASE_URL,
  });

  if (!parsed.success) {
    throw new Error(
      `Pollinations environment is incomplete: ${parsed.error.issues
        .map((issue) => issue.path.join("."))
        .join(", ")}`,
    );
  }

  return parsed.data;
}
