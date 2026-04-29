export type AppRole = "user" | "admin";
export type PaymentStatus =
  | "pending"
  | "processing"
  | "paid"
  | "failed"
  | "expired"
  | "cancelled";
export type SubscriptionStatus = "inactive" | "pending" | "active" | "expired";
export type GenerationFormat = "square" | "story" | "print";

export type ProfileRecord = {
  id: string;
  email: string;
  full_name: string | null;
  business_name: string | null;
  phone: string | null;
  business_category: string | null;
  city: string | null;
  whatsapp_phone: string | null;
  brand_tone: string | null;
  onboarding_completed: boolean;
  role: AppRole;
  plan_id: string;
  quota_used: number;
  bonus_credits: number;
  quota_period_start: string;
  created_at: string;
  updated_at: string;
};

export type SubscriptionRecord = {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  started_at: string;
  ends_at: string | null;
  renewed_manually: boolean;
  payment_reference: string | null;
  created_at: string;
  updated_at: string;
};

export type PaymentRecord = {
  id: string;
  user_id: string;
  plan_id: string;
  purchase_kind?: "plan" | "credit_pack";
  provider: string;
  provider_reference: string | null;
  status: PaymentStatus;
  amount_xaf: number;
  currency: string;
  msisdn: string | null;
  operator_name: string | null;
  raw_payload: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type QuotaSnapshot = {
  plan_id: string;
  monthly_quota: number;
  quota_used: number;
  bonus_credits: number;
  quota_remaining: number;
  watermark_enabled: boolean;
};

export type ViewerRecord = {
  user: {
    id: string;
    email?: string;
    email_confirmed_at?: string | null;
    last_sign_in_at?: string | null;
  };
  profile: ProfileRecord;
  subscription: SubscriptionRecord | null;
};

export type PromptOptimizationResult = {
  safety: "allowed" | "blocked";
  rejection_reason: string | null;
  improved_prompt: string;
  short_title: string;
  social_caption: string;
  visual_strategy: string;
  audience_angle: string;
  layout_strategy: string;
  image_direction: string;
  commercial_intent_classification: "launch" | "booking" | "premium_positioning" | "general_conversion";
};

export type GenerationRefinementQuestionType = "text" | "single_choice";

export type GenerationRefinementQuestion = {
  id: string;
  prompt: string;
  type: GenerationRefinementQuestionType;
  placeholder: string;
  options: string[];
};
