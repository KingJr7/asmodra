create extension if not exists pgcrypto;

create table if not exists public.plans (
  id text primary key,
  name text not null,
  monthly_price_xaf integer not null check (monthly_price_xaf >= 0),
  monthly_quota integer not null check (monthly_quota >= 0),
  watermark boolean not null default false,
  description text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.plans (id, name, monthly_price_xaf, monthly_quota, watermark, description)
values
  ('starter', 'Starter', 0, 17, true, 'Plan gratuit en credits avec watermark.'),
  ('pro', 'Pro', 15000, 260, false, 'Plan mensuel optimise pour production reguliere.'),
  ('business', 'Business', 35000, 760, false, 'Plan mensuel pour volumes eleves.'),
  ('credits_5', 'Top-up 5', 1000, 5, false, 'Micro recharge 5 credits.'),
  ('credits_35', 'Pack 35', 5000, 35, false, 'Pack flexible 35 credits.'),
  ('credits_80', 'Pack 80', 10000, 80, false, 'Pack standard 80 credits.'),
  ('credits_180', 'Pack 180', 20000, 180, false, 'Pack volume 180 credits.')
on conflict (id) do update
set
  name = excluded.name,
  monthly_price_xaf = excluded.monthly_price_xaf,
  monthly_quota = excluded.monthly_quota,
  watermark = excluded.watermark,
  description = excluded.description,
  active = true;

update public.plans
set active = false
where id in ('credits_10', 'credits_25', 'credits_55', 'credits_130', 'credits_300');

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  business_name text,
  phone text,
  business_category text,
  city text,
  whatsapp_phone text,
  brand_tone text,
  onboarding_completed boolean not null default false,
  role text not null default 'user' check (role in ('user', 'admin')),
  plan_id text not null default 'starter' references public.plans (id),
  quota_used integer not null default 0,
  bonus_credits integer not null default 0,
  quota_period_start date not null default date_trunc('month', now())::date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists business_category text;
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists whatsapp_phone text;
alter table public.profiles add column if not exists brand_tone text;
alter table public.profiles add column if not exists onboarding_completed boolean not null default false;
alter table public.profiles add column if not exists bonus_credits integer not null default 0;

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  plan_id text not null references public.plans (id),
  status text not null check (status in ('inactive', 'pending', 'active', 'expired')),
  started_at timestamptz not null default now(),
  ends_at timestamptz,
  renewed_manually boolean not null default true,
  payment_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan_id text not null references public.plans (id),
  purchase_kind text not null default 'plan' check (purchase_kind in ('plan', 'credit_pack')),
  provider text not null default 'yabetoo',
  provider_reference text unique,
  status text not null check (status in ('pending', 'processing', 'paid', 'failed', 'expired', 'cancelled')),
  amount_xaf integer not null check (amount_xaf >= 0),
  currency text not null default 'xaf',
  msisdn text,
  operator_name text,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payment_transactions add column if not exists purchase_kind text not null default 'plan';

create table if not exists public.generation_audits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'completed',
  format text not null,
  model text not null,
  prompt_hash text not null,
  source_prompt text,
  improved_prompt text,
  output_asset_path text,
  safety_decision text not null default 'allowed',
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.generation_quota_reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  credits_cost integer not null check (credits_cost > 0),
  monthly_credits_used integer not null default 0 check (monthly_credits_used >= 0),
  bonus_credits_used integer not null default 0 check (bonus_credits_used >= 0),
  status text not null default 'reserved' check (status in ('reserved', 'finalized', 'cancelled')),
  cancel_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  bucket text not null,
  path text not null unique,
  mime_type text not null,
  bytes integer not null,
  kind text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_type text not null,
  reference text,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_subscriptions_updated_at on public.subscriptions;
create trigger trg_subscriptions_updated_at
before update on public.subscriptions
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_payments_updated_at on public.payment_transactions;
create trigger trg_payments_updated_at
before update on public.payment_transactions
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_generation_quota_reservations_updated_at on public.generation_quota_reservations;
create trigger trg_generation_quota_reservations_updated_at
before update on public.generation_quota_reservations
for each row execute procedure public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.reset_quota_if_needed(p_user_id uuid)
returns public.profiles
language plpgsql
security definer
as $$
declare
  current_profile public.profiles;
begin
  select * into current_profile from public.profiles where id = p_user_id for update;

  if current_profile.quota_period_start < date_trunc('month', now())::date then
    update public.profiles
    set quota_used = 0,
        quota_period_start = date_trunc('month', now())::date
    where id = p_user_id
    returning * into current_profile;
  end if;

  return current_profile;
end;
$$;

drop function if exists public.consume_generation_quota(
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  jsonb
);

drop function if exists public.consume_generation_quota(
  uuid,
  text,
  text,
  integer,
  text,
  text,
  text,
  text,
  text,
  jsonb
);

create or replace function public.consume_generation_quota(
  p_user_id uuid,
  p_format text,
  p_model text,
  p_credits_cost integer,
  p_prompt_hash text,
  p_source_prompt text,
  p_improved_prompt text,
  p_output_asset_path text,
  p_safety_decision text,
  p_metadata jsonb default '{}'::jsonb
)
returns table (
  quota_used integer,
  bonus_credits integer,
  quota_remaining integer,
  credits_cost integer
)
language plpgsql
security definer
as $$
declare
  current_profile public.profiles;
  current_plan public.plans;
  remaining_cost integer;
  monthly_remaining integer;
  monthly_to_consume integer;
begin
  if p_credits_cost is null or p_credits_cost <= 0 then
    raise exception 'INVALID_CREDITS_COST';
  end if;

  select * into current_profile from public.reset_quota_if_needed(p_user_id);
  select * into current_plan from public.plans where id = current_profile.plan_id;

  monthly_remaining := greatest(current_plan.monthly_quota - current_profile.quota_used, 0);

  if monthly_remaining + current_profile.bonus_credits < p_credits_cost then
    raise exception 'QUOTA_EXCEEDED';
  end if;

  remaining_cost := p_credits_cost;
  monthly_to_consume := least(monthly_remaining, remaining_cost);

  if monthly_to_consume > 0 then
    update public.profiles as p
    set quota_used = p.quota_used + monthly_to_consume
    where id = p_user_id
    returning * into current_profile;
    remaining_cost := remaining_cost - monthly_to_consume;
  end if;

  if remaining_cost > 0 then
    update public.profiles as p
    set bonus_credits = greatest(p.bonus_credits - remaining_cost, 0)
    where id = p_user_id
    returning * into current_profile;
  end if;

  insert into public.generation_audits (
    user_id,
    format,
    model,
    prompt_hash,
    source_prompt,
    improved_prompt,
    output_asset_path,
    safety_decision,
    metadata
  )
  values (
    p_user_id,
    p_format,
    p_model,
    p_prompt_hash,
    p_source_prompt,
    p_improved_prompt,
    p_output_asset_path,
    p_safety_decision,
    p_metadata
  );

  return query
  select
    current_profile.quota_used,
    current_profile.bonus_credits,
    greatest(current_plan.monthly_quota - current_profile.quota_used, 0) + current_profile.bonus_credits,
    p_credits_cost;
end;
$$;

drop function if exists public.reserve_generation_quota(uuid, integer);
create or replace function public.reserve_generation_quota(
  p_user_id uuid,
  p_credits_cost integer
)
returns table (
  reservation_id uuid,
  quota_used integer,
  bonus_credits integer,
  quota_remaining integer,
  credits_cost integer
)
language plpgsql
security definer
as $$
declare
  current_profile public.profiles;
  current_plan public.plans;
  reservation_row public.generation_quota_reservations;
  remaining_cost integer;
  monthly_remaining integer;
  monthly_to_consume integer;
begin
  if p_credits_cost is null or p_credits_cost <= 0 then
    raise exception 'INVALID_CREDITS_COST';
  end if;

  select * into current_profile from public.reset_quota_if_needed(p_user_id);
  select * into current_plan from public.plans where id = current_profile.plan_id;

  monthly_remaining := greatest(current_plan.monthly_quota - current_profile.quota_used, 0);

  if monthly_remaining + current_profile.bonus_credits < p_credits_cost then
    raise exception 'QUOTA_EXCEEDED';
  end if;

  remaining_cost := p_credits_cost;
  monthly_to_consume := least(monthly_remaining, remaining_cost);

  if monthly_to_consume > 0 then
    update public.profiles as p
    set quota_used = p.quota_used + monthly_to_consume
    where id = p_user_id
    returning * into current_profile;
    remaining_cost := remaining_cost - monthly_to_consume;
  end if;

  if remaining_cost > 0 then
    update public.profiles as p
    set bonus_credits = greatest(p.bonus_credits - remaining_cost, 0)
    where id = p_user_id
    returning * into current_profile;
  end if;

  insert into public.generation_quota_reservations (
    user_id,
    credits_cost,
    monthly_credits_used,
    bonus_credits_used
  )
  values (
    p_user_id,
    p_credits_cost,
    monthly_to_consume,
    remaining_cost
  )
  returning * into reservation_row;

  return query
  select
    reservation_row.id,
    current_profile.quota_used,
    current_profile.bonus_credits,
    greatest(current_plan.monthly_quota - current_profile.quota_used, 0) + current_profile.bonus_credits,
    p_credits_cost;
end;
$$;

drop function if exists public.finalize_generation_reservation(uuid, text, text, text, text, text, text, text, jsonb);
create or replace function public.finalize_generation_reservation(
  p_reservation_id uuid,
  p_format text,
  p_model text,
  p_prompt_hash text,
  p_source_prompt text,
  p_improved_prompt text,
  p_output_asset_path text,
  p_safety_decision text,
  p_metadata jsonb default '{}'::jsonb
)
returns table (
  quota_used integer,
  bonus_credits integer,
  quota_remaining integer,
  credits_cost integer
)
language plpgsql
security definer
as $$
declare
  reservation_row public.generation_quota_reservations;
  current_profile public.profiles;
  current_plan public.plans;
begin
  select * into reservation_row
  from public.generation_quota_reservations
  where id = p_reservation_id
  for update;

  if reservation_row.id is null then
    raise exception 'RESERVATION_NOT_FOUND';
  end if;

  if reservation_row.status != 'reserved' then
    raise exception 'RESERVATION_ALREADY_%', upper(reservation_row.status);
  end if;

  select * into current_profile from public.reset_quota_if_needed(reservation_row.user_id);
  select * into current_plan from public.plans where id = current_profile.plan_id;

  insert into public.generation_audits (
    user_id,
    format,
    model,
    prompt_hash,
    source_prompt,
    improved_prompt,
    output_asset_path,
    safety_decision,
    metadata
  )
  values (
    reservation_row.user_id,
    p_format,
    p_model,
    p_prompt_hash,
    p_source_prompt,
    p_improved_prompt,
    p_output_asset_path,
    p_safety_decision,
    p_metadata
  );

  update public.generation_quota_reservations
  set status = 'finalized'
  where id = reservation_row.id;

  return query
  select
    current_profile.quota_used,
    current_profile.bonus_credits,
    greatest(current_plan.monthly_quota - current_profile.quota_used, 0) + current_profile.bonus_credits,
    reservation_row.credits_cost;
end;
$$;

drop function if exists public.cancel_generation_reservation(uuid, text);
create or replace function public.cancel_generation_reservation(
  p_reservation_id uuid,
  p_reason text default null
)
returns table (
  quota_used integer,
  bonus_credits integer,
  quota_remaining integer,
  credits_cost integer
)
language plpgsql
security definer
as $$
declare
  reservation_row public.generation_quota_reservations;
  current_profile public.profiles;
  current_plan public.plans;
begin
  select * into reservation_row
  from public.generation_quota_reservations
  where id = p_reservation_id
  for update;

  if reservation_row.id is null then
    raise exception 'RESERVATION_NOT_FOUND';
  end if;

  if reservation_row.status = 'reserved' then
    update public.profiles as p
    set quota_used = greatest(p.quota_used - reservation_row.monthly_credits_used, 0),
        bonus_credits = p.bonus_credits + reservation_row.bonus_credits_used
    where id = reservation_row.user_id
    returning * into current_profile;

    update public.generation_quota_reservations
    set status = 'cancelled',
        cancel_reason = coalesce(p_reason, cancel_reason)
    where id = reservation_row.id;
  else
    select * into current_profile from public.profiles where id = reservation_row.user_id;
  end if;

  select * into current_plan from public.plans where id = current_profile.plan_id;

  return query
  select
    current_profile.quota_used,
    current_profile.bonus_credits,
    greatest(current_plan.monthly_quota - current_profile.quota_used, 0) + current_profile.bonus_credits,
    reservation_row.credits_cost;
end;
$$;

create or replace function public.add_bonus_credits(
  p_user_id uuid,
  p_credits integer
)
returns public.profiles
language plpgsql
security definer
as $$
declare
  current_profile public.profiles;
begin
  update public.profiles as p
  set bonus_credits = p.bonus_credits + greatest(p_credits, 0)
  where id = p_user_id
  returning * into current_profile;

  return current_profile;
end;
$$;

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.assets enable row level security;
alter table public.generation_audits enable row level security;
alter table public.generation_quota_reservations enable row level security;
alter table public.webhook_events enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own"
on public.subscriptions for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "payments_select_own" on public.payment_transactions;
create policy "payments_select_own"
on public.payment_transactions for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "assets_select_own" on public.assets;
create policy "assets_select_own"
on public.assets for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "generation_audits_no_user_select" on public.generation_audits;
create policy "generation_audits_no_user_select"
on public.generation_audits for select
to authenticated
using (false);

drop policy if exists "generation_quota_reservations_no_user_select" on public.generation_quota_reservations;
create policy "generation_quota_reservations_no_user_select"
on public.generation_quota_reservations for select
to authenticated
using (false);

insert into storage.buckets (id, name, public)
values ('brand-assets', 'brand-assets', false)
on conflict (id) do nothing;
