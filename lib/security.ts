import crypto from "node:crypto";

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const blockedTerms = [
  "weapon",
  "nudity",
  "porn",
  "terror",
  "explosive",
  "counterfeit",
  "deepfake",
  "hate speech",
  "bloodbath",
];

export function sanitizeText(value: FormDataEntryValue | null | undefined) {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/\s+/g, " ").trim();
}

export function sanitizeMultiline(value: FormDataEntryValue | null | undefined) {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/\r/g, "").trim();
}

export function hashString(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function hasBlockedTerms(value: string) {
  const normalized = value.toLowerCase();
  return blockedTerms.find((term) => normalized.includes(term));
}

export function enforceRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (current.count >= limit) {
    throw new Error("RATE_LIMITED");
  }

  current.count += 1;
  rateLimitStore.set(key, current);
}

export function assertAllowedFile(file: File, maxBytes = 8 * 1024 * 1024) {
  const allowedTypes = ["image/png", "image/jpeg", "image/webp"];

  if (!allowedTypes.includes(file.type)) {
    throw new Error("INVALID_FILE_TYPE");
  }

  if (file.size > maxBytes) {
    throw new Error("FILE_TOO_LARGE");
  }
}

export function buildStoragePath(userId: string, kind: string, filename: string) {
  const ext = filename.includes(".") ? filename.split(".").pop() : "bin";
  return `${userId}/${kind}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
}

export function constantTimeEqual(a: string, b: string) {
  const first = Buffer.from(a);
  const second = Buffer.from(b);

  if (first.length !== second.length) {
    return false;
  }

  return crypto.timingSafeEqual(first, second);
}

export function signHmacSha256(payload: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export const SECURITY_HEADERS = [
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co https://openrouter.ai https://pay.api.yabetoopay.com https://pay.sandbox.yabetoopay.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';",
  },
];
