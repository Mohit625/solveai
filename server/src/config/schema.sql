-- SolveAI database schema
-- Safe to re-run in full at any time — every statement is idempotent
-- (create-if-not-exists tables, drop-then-create policies, add-column-if-
-- not-exists). A prior run failing partway through (e.g. because a policy
-- already existed) can leave earlier statements in the same paste rolled
-- back, so re-running the whole file after a fix is the expected workflow.

-- =========================
-- profiles
-- =========================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =========================
-- chats
-- =========================
create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null default 'New Chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.chats enable row level security;

drop policy if exists "chats_all_own" on public.chats;
create policy "chats_all_own" on public.chats
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =========================
-- messages
-- =========================
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  image_url text,
  image_urls jsonb,
  ocr_text text,
  language text,
  question_type text,
  generated_code text,
  prompt_tokens integer,
  completion_tokens integer,
  latency integer,
  created_at timestamptz not null default now()
);

-- Safe to re-run on a database created before multi-screenshot support existed.
alter table public.messages add column if not exists image_urls jsonb;

alter table public.messages enable row level security;

drop policy if exists "messages_all_via_chat_owner" on public.messages;
create policy "messages_all_via_chat_owner" on public.messages
  for all using (
    exists (
      select 1 from public.chats
      where chats.id = messages.chat_id and chats.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.chats
      where chats.id = messages.chat_id and chats.user_id = auth.uid()
    )
  );

-- =========================
-- usage_logs
-- =========================
create table if not exists public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  api_cost numeric,
  latency integer,
  cache_hit boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.usage_logs enable row level security;

drop policy if exists "usage_logs_all_own" on public.usage_logs;
create policy "usage_logs_all_own" on public.usage_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =========================
-- storage: screenshots bucket
-- =========================
insert into storage.buckets (id, name, public)
values ('screenshots', 'screenshots', false)
on conflict (id) do nothing;

drop policy if exists "screenshots_insert_own" on storage.objects;
create policy "screenshots_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'screenshots' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "screenshots_select_own" on storage.objects;
create policy "screenshots_select_own" on storage.objects
  for select using (
    bucket_id = 'screenshots' and (storage.foldername(name))[1] = auth.uid()::text
  );
