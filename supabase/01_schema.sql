-- =====================================================================
-- OreLink database, part 1
-- Run this ONCE in Supabase: SQL Editor -> New query -> paste -> Run.
-- It creates every table the first version needs, plus the security
-- rules (Row Level Security). The rules run on Supabase's servers, so a
-- user cannot get around them from their phone or browser.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Admins (the OreLink team)
-- ---------------------------------------------------------------------
create table public.admins (
  user_id uuid primary key references auth.users on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

create or replace function public.is_admin(u uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = u)
$$;

create policy "admins can see the admin list" on public.admins
  for select to authenticated using (public.is_admin() or user_id = auth.uid());

-- ---------------------------------------------------------------------
-- Profiles (public part of a member: name, role, district)
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  first_name text,
  last_name text,
  role text not null default 'buyer' check (role in ('miner','buyer')),
  plan text not null default 'Member',
  district text,
  reason text,
  scope text not null default 'local' check (scope in ('local','intl','both')),
  via text not null default 'email',
  theme text not null default 'dark' check (theme in ('dark','light','system')),
  agreed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "members can see profiles" on public.profiles
  for select to authenticated using (true);
create policy "create your own profile" on public.profiles
  for insert to authenticated with check (id = auth.uid());
create policy "edit your own profile, admins edit any" on public.profiles
  for update to authenticated using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());
create policy "admins delete profiles" on public.profiles
  for delete to authenticated using (public.is_admin() or id = auth.uid());

-- Members cannot change their own package or join date.
create or replace function public.protect_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if new.plan not in ('Member','Seller','Buyer','Service provider') then new.plan := 'Member'; end if;
    new.agreed_at := now(); new.created_at := now();
  elsif not public.is_admin() then
    new.plan := old.plan; new.agreed_at := old.agreed_at; new.created_at := old.created_at;
  end if;
  return new;
end $$;
create trigger protect_profile before insert or update on public.profiles
  for each row execute function public.protect_profile();

-- ---------------------------------------------------------------------
-- Private contact details. Kept apart from profiles so phone numbers are
-- NOT visible to everyone. Shared only through get_contact() below.
-- ---------------------------------------------------------------------
create table public.contacts (
  user_id uuid primary key references public.profiles on delete cascade,
  email text,
  phone text,
  phone_verified boolean not null default false
);
alter table public.contacts enable row level security;

create policy "see your own contacts, admins see all" on public.contacts
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "add your own contacts" on public.contacts
  for insert to authenticated with check (user_id = auth.uid());
create policy "edit your own contacts" on public.contacts
  for update to authenticated using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- The email always comes from the login account, and members cannot
-- mark their own phone as verified.
create or replace function public.protect_contacts()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.email := (select email from auth.users where id = new.user_id);
  if not public.is_admin() then
    if tg_op = 'INSERT' then new.phone_verified := false;
    else new.phone_verified := old.phone_verified and coalesce(new.phone, '') = coalesce(old.phone, ''); end if;
  end if;
  return new;
end $$;
create trigger protect_contacts before insert or update on public.contacts
  for each row execute function public.protect_contacts();

-- ---------------------------------------------------------------------
-- Verification, suspension
-- ---------------------------------------------------------------------
create table public.verifications (
  user_id uuid primary key references public.profiles on delete cascade,
  docs text[] not null default '{}',
  method text not null default 'documents',
  verified_by uuid references auth.users,
  verified_at timestamptz not null default now()
);
alter table public.verifications enable row level security;
create policy "everyone sees who is verified" on public.verifications
  for select to authenticated using (true);
create policy "only admins verify" on public.verifications
  for insert to authenticated with check (public.is_admin());
create policy "only admins revoke" on public.verifications
  for delete to authenticated using (public.is_admin());

create table public.suspensions (
  user_id uuid primary key references public.profiles on delete cascade,
  reason text,
  suspended_by uuid references auth.users,
  created_at timestamptz not null default now()
);
alter table public.suspensions enable row level security;
create policy "everyone sees suspensions" on public.suspensions
  for select to authenticated using (true);
create policy "only admins suspend" on public.suspensions
  for insert to authenticated with check (public.is_admin());
create policy "only admins unsuspend" on public.suspensions
  for delete to authenticated using (public.is_admin());

create or replace function public.is_verified(u uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select (exists (select 1 from public.verifications where user_id = u) or public.is_admin(u))
     and not exists (select 1 from public.suspensions where user_id = u)
$$;

-- ---------------------------------------------------------------------
-- KYC (verification documents). Private: owner and admins only.
-- ---------------------------------------------------------------------
create table public.kyc (
  user_id uuid primary key references public.profiles on delete cascade,
  id_type text not null default 'nid' check (id_type in ('nid','passport','dl')),
  details jsonb not null default '{}'::jsonb,
  pay_ref text,
  submitted boolean not null default false,
  submitted_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.kyc enable row level security;
create policy "see your own kyc, admins see all" on public.kyc
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "start your own kyc" on public.kyc
  for insert to authenticated with check (user_id = auth.uid());
create policy "update your own kyc, admins any" on public.kyc
  for update to authenticated using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create table public.kyc_docs (
  user_id uuid not null references public.profiles on delete cascade,
  doc_key text not null check (doc_key in ('id_front','id_back','addr','selfie','biz1','exp','biz2')),
  path text not null,
  content_type text,
  status text not null default 'pending' check (status in ('pending','ok','rej')),
  reason text,
  uploaded_at timestamptz not null default now(),
  reviewed_by uuid references auth.users,
  reviewed_at timestamptz,
  primary key (user_id, doc_key)
);
alter table public.kyc_docs enable row level security;
create policy "see your own documents, admins see all" on public.kyc_docs
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "upload your own documents" on public.kyc_docs
  for insert to authenticated with check (user_id = auth.uid() and status = 'pending');
create policy "replace your own documents unless accepted" on public.kyc_docs
  for update to authenticated using (user_id = auth.uid() and status <> 'ok')
  with check (user_id = auth.uid() and status = 'pending');
create policy "admins review documents" on public.kyc_docs
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- Marketplace: mineral & fuel listings, equipment & mines, services
-- ---------------------------------------------------------------------
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  kind text not null check (kind in ('supply','demand')),
  fuel boolean not null default false,
  mineral text not null,
  title text,
  qty numeric check (qty is null or qty > 0),
  unit text,
  grade text,
  assay text not null default 'no' check (assay in ('yes','no')),
  lic_type text,
  lic_no text,
  district text,
  price text,
  notes text check (notes is null or char_length(notes) <= 2000),
  img_path text,
  art text,
  lat double precision,
  lng double precision,
  sold boolean not null default false,
  sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.equipment (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  title text not null,
  cat text not null,
  cond text,
  mine boolean not null default false,
  price text,
  district text,
  notes text check (notes is null or char_length(notes) <= 2000),
  img_path text,
  art text,
  lat double precision,
  lng double precision,
  sold boolean not null default false,
  sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  cat text not null,
  sub text,
  title text not null,
  price text,
  district text,
  notes text check (notes is null or char_length(notes) <= 2000),
  img_path text,
  art text,
  lat double precision,
  lng double precision,
  sold boolean not null default false,
  sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['listings','equipment','services'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "members can browse" on public.%I for select to authenticated using (true)', t);
    execute format('create policy "verified members post" on public.%I for insert to authenticated with check (user_id = auth.uid() and public.is_verified())', t);
    execute format('create policy "owners and admins edit" on public.%I for update to authenticated using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin())', t);
    execute format('create policy "owners and admins remove" on public.%I for delete to authenticated using (user_id = auth.uid() or public.is_admin())', t);
    execute format('create index on public.%I (created_at desc)', t);
  end loop;
end $$;

-- Gold listings for sale must carry a licence type and number (server-side check).
alter table public.listings add constraint gold_needs_licence check (
  kind = 'demand' or fuel or mineral !~* 'gold'
  or (lic_type is not null and lic_type not in ('Select','I do not have one yet') and coalesce(lic_no,'') <> '')
);

-- ---------------------------------------------------------------------
-- Chats, deals, ratings
-- ---------------------------------------------------------------------
create table public.threads (
  id uuid primary key default gen_random_uuid(),
  item_type text not null check (item_type in ('listings','equipment','services')),
  item_id uuid not null,
  title text,
  owner uuid not null references public.profiles on delete cascade,
  other uuid not null references public.profiles on delete cascade,
  owner_agreed boolean not null default false,
  other_agreed boolean not null default false,
  deal jsonb not null default '{}'::jsonb,
  desk jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (item_type, item_id, other),
  check (owner <> other)
);
alter table public.threads enable row level security;

create or replace function public.in_thread(t uuid, u uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.threads where id = t and (owner = u or other = u))
$$;

create policy "participants see their chats" on public.threads
  for select to authenticated using (owner = auth.uid() or other = auth.uid() or public.is_admin());
create policy "verified members start chats" on public.threads
  for insert to authenticated with check (other = auth.uid() and public.is_verified());
-- Updates (agree, offers, deal desk) only go through the functions below.

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.threads on delete cascade,
  sender uuid not null default auth.uid() references public.profiles on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
alter table public.messages enable row level security;
create index on public.messages (thread_id, created_at);
create policy "participants read messages" on public.messages
  for select to authenticated using (public.in_thread(thread_id) or public.is_admin());
create policy "verified participants send" on public.messages
  for insert to authenticated with check (sender = auth.uid() and public.in_thread(thread_id) and public.is_verified());

-- Tap "Agree to proceed".
create or replace function public.agree_to_proceed(t uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.threads set
    owner_agreed = owner_agreed or owner = auth.uid(),
    other_agreed = other_agreed or other = auth.uid(),
    updated_at = now()
  where id = t and (owner = auth.uid() or other = auth.uid());
end $$;

-- Phone and email of another member. Returned ONLY when both sides of a
-- chat have agreed to proceed (or for yourself, or for admins).
create or replace function public.get_contact(u uuid)
returns table (phone text, email text) language sql stable security definer set search_path = public as $$
  select c.phone, c.email from public.contacts c
  where c.user_id = u and (
    u = auth.uid() or public.is_admin() or exists (
      select 1 from public.threads t
      where t.owner_agreed and t.other_agreed
        and ((t.owner = auth.uid() and t.other = u) or (t.other = auth.uid() and t.owner = u))
    )
  )
$$;

create table public.ratings (
  thread_id uuid not null references public.threads on delete cascade,
  from_user uuid not null default auth.uid() references public.profiles on delete cascade,
  to_user uuid not null references public.profiles on delete cascade,
  stars int not null check (stars between 1 and 5),
  body text check (body is null or char_length(body) <= 1000),
  created_at timestamptz not null default now(),
  primary key (thread_id, from_user)
);
alter table public.ratings enable row level security;
create policy "everyone sees ratings" on public.ratings for select to authenticated using (true);
create policy "rate a completed deal you were in" on public.ratings
  for insert to authenticated with check (
    from_user = auth.uid() and exists (
      select 1 from public.threads t where t.id = thread_id and t.deal->>'st' = 'done'
        and ((t.owner = auth.uid() and t.other = to_user) or (t.other = auth.uid() and t.owner = to_user))
    )
  );

-- ---------------------------------------------------------------------
-- Safety: reports and blocks
-- ---------------------------------------------------------------------
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  against uuid not null references public.profiles on delete cascade,
  reporter uuid not null default auth.uid() references public.profiles on delete cascade,
  reason text not null,
  details text check (details is null or char_length(details) <= 2000),
  created_at timestamptz not null default now()
);
alter table public.reports enable row level security;
create policy "send a report" on public.reports
  for insert to authenticated with check (reporter = auth.uid() and against <> auth.uid());
create policy "admins see reports" on public.reports
  for select to authenticated using (public.is_admin() or reporter = auth.uid());
create policy "admins dismiss reports" on public.reports
  for delete to authenticated using (public.is_admin());

create table public.blocks (
  blocker uuid not null default auth.uid() references public.profiles on delete cascade,
  blocked uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker, blocked)
);
alter table public.blocks enable row level security;
create policy "manage your own blocks" on public.blocks
  for all to authenticated using (blocker = auth.uid()) with check (blocker = auth.uid());

-- ---------------------------------------------------------------------
-- News, events and reference prices (posted by the OreLink team)
-- ---------------------------------------------------------------------
create table public.feed (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('news','price','event')),
  title text not null,
  body text,
  event_date date,
  place text,
  img_path text,
  video_path text,
  created_by uuid default auth.uid() references auth.users,
  created_at timestamptz not null default now()
);
alter table public.feed enable row level security;
create policy "everyone reads the feed" on public.feed for select to authenticated using (true);
create policy "admins post to the feed" on public.feed for insert to authenticated with check (public.is_admin());
create policy "admins remove from the feed" on public.feed for delete to authenticated using (public.is_admin());

create table public.quotes (
  sym text primary key,
  name text,
  price numeric not null,
  pct numeric not null default 0,
  chg numeric not null default 0,
  vol text,
  hi text,
  lo text,
  sample boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.quotes enable row level security;
create policy "everyone reads prices" on public.quotes for select to authenticated using (true);
create policy "admins manage prices" on public.quotes for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- Live updates for chats
-- ---------------------------------------------------------------------
alter publication supabase_realtime add table public.messages, public.threads;

-- ---------------------------------------------------------------------
-- File storage: "kyc" is private (ID documents), "media" is public
-- (listing photos). Each member can only write inside their own folder.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('kyc', 'kyc', false, 8388608), ('media', 'media', true, 5242880)
on conflict (id) do nothing;

create policy "kyc: upload to your own folder" on storage.objects
  for insert to authenticated with check (bucket_id = 'kyc' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "kyc: replace in your own folder" on storage.objects
  for update to authenticated using (bucket_id = 'kyc' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "kyc: owner and admins can view" on storage.objects
  for select to authenticated using (bucket_id = 'kyc' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

create policy "media: upload to your own folder" on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "media: replace your own files" on storage.objects
  for update to authenticated using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "media: remove your own files, admins any" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy "media: anyone can view" on storage.objects
  for select using (bucket_id = 'media');
