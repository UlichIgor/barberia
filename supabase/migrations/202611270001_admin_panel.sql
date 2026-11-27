-- YARO BARBERIA admin workspace. Apply ONLY to a dedicated BARBERIA Supabase project.
-- Admin authorization uses trusted app_metadata JWT claims, never user-editable user_metadata.

alter table public.barber_services
  add column if not exists description text not null default '',
  add column if not exists sort_order integer not null default 0;

-- Public reviews are queued for moderation; only published reviews are public.
create table if not exists public.barber_reviews (
  id uuid primary key default gen_random_uuid(),
  client_name text not null check (char_length(trim(client_name)) between 2 and 80),
  rating integer not null check (rating between 1 and 5),
  message text not null check (char_length(trim(message)) between 8 and 1500),
  status text not null default 'pending' check (status in ('pending','published','hidden')),
  created_at timestamptz not null default now()
);

create table if not exists public.barber_portfolio (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Нова робота',
  image_url text not null,
  storage_path text not null unique,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists barber_reviews_created_at_idx on public.barber_reviews(created_at desc);
create index if not exists barber_portfolio_created_at_idx on public.barber_portfolio(created_at desc);

alter table public.barber_reviews enable row level security;
alter table public.barber_portfolio enable row level security;

-- Admin policies are based on app_metadata.role, set only by a trusted project admin.
drop policy if exists "YARO admins manage all services" on public.barber_services;
create policy "YARO admins manage all services" on public.barber_services
  for all to authenticated
  using ((select auth.jwt()->'app_metadata'->>'role') = 'admin')
  with check ((select auth.jwt()->'app_metadata'->>'role') = 'admin');

grant select, insert, update, delete on public.barber_services to authenticated;

drop policy if exists "YARO admins read all appointments" on public.barber_appointments;
create policy "YARO admins read all appointments" on public.barber_appointments
  for select to authenticated
  using ((select auth.jwt()->'app_metadata'->>'role') = 'admin');
drop policy if exists "YARO admins update appointments" on public.barber_appointments;
create policy "YARO admins update appointments" on public.barber_appointments
  for update to authenticated
  using ((select auth.jwt()->'app_metadata'->>'role') = 'admin')
  with check ((select auth.jwt()->'app_metadata'->>'role') = 'admin');
drop policy if exists "YARO admins delete appointments" on public.barber_appointments;
create policy "YARO admins delete appointments" on public.barber_appointments
  for delete to authenticated
  using ((select auth.jwt()->'app_metadata'->>'role') = 'admin');
grant select, update, delete on public.barber_appointments to authenticated;

-- Public clients may submit reviews, but cannot read/update/delete them.
drop policy if exists "Visitors submit pending YARO reviews" on public.barber_reviews;
create policy "Visitors submit pending YARO reviews" on public.barber_reviews
  for insert to anon, authenticated with check (status = 'pending');
drop policy if exists "Public read published YARO reviews" on public.barber_reviews;
create policy "Public read published YARO reviews" on public.barber_reviews
  for select to anon, authenticated using (status = 'published');
drop policy if exists "YARO admins manage reviews" on public.barber_reviews;
create policy "YARO admins manage reviews" on public.barber_reviews
  for all to authenticated
  using ((select auth.jwt()->'app_metadata'->>'role') = 'admin')
  with check ((select auth.jwt()->'app_metadata'->>'role') = 'admin');
grant select, insert on public.barber_reviews to anon, authenticated;
grant update, delete on public.barber_reviews to authenticated;

-- Public gallery reads published entries only. Management remains admin-only.
drop policy if exists "Public read published YARO portfolio" on public.barber_portfolio;
create policy "Public read published YARO portfolio" on public.barber_portfolio
  for select to anon, authenticated using (published = true);
drop policy if exists "YARO admins manage portfolio" on public.barber_portfolio;
create policy "YARO admins manage portfolio" on public.barber_portfolio
  for all to authenticated
  using ((select auth.jwt()->'app_metadata'->>'role') = 'admin')
  with check ((select auth.jwt()->'app_metadata'->>'role') = 'admin');
grant select on public.barber_portfolio to anon, authenticated;
grant insert, update, delete on public.barber_portfolio to authenticated;

-- Public bucket serves published haircut images. Writes/listing are restricted to admins.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('barber-portfolio', 'barber-portfolio', true, 6291456, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 6291456,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "YARO admins upload portfolio images" on storage.objects;
create policy "YARO admins upload portfolio images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'barber-portfolio' and (select auth.jwt()->'app_metadata'->>'role') = 'admin');
drop policy if exists "YARO admins update portfolio images" on storage.objects;
create policy "YARO admins update portfolio images" on storage.objects
  for update to authenticated
  using (bucket_id = 'barber-portfolio' and (select auth.jwt()->'app_metadata'->>'role') = 'admin')
  with check (bucket_id = 'barber-portfolio' and (select auth.jwt()->'app_metadata'->>'role') = 'admin');
drop policy if exists "YARO admins delete portfolio images" on storage.objects;
create policy "YARO admins delete portfolio images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'barber-portfolio' and (select auth.jwt()->'app_metadata'->>'role') = 'admin');
drop policy if exists "YARO admins list portfolio images" on storage.objects;
create policy "YARO admins list portfolio images" on storage.objects
  for select to authenticated
  using (bucket_id = 'barber-portfolio' and (select auth.jwt()->'app_metadata'->>'role') = 'admin');

-- Add explicit public insert grant for review form, while appointment data remains private.

-- Return only busy time intervals for a single local-day window. This deliberately
-- excludes client names, phone numbers and service details from the public API.
create or replace function public.get_barber_busy_slots(p_day_start timestamptz, p_day_end timestamptz)
returns table (starts_at timestamptz, ends_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select a.starts_at, a.ends_at
  from public.barber_appointments as a
  where a.starts_at < p_day_end
    and a.ends_at > p_day_start
    and a.status in ('pending', 'confirmed');
$$;
revoke all on function public.get_barber_busy_slots(timestamptz, timestamptz) from public;
grant execute on function public.get_barber_busy_slots(timestamptz, timestamptz) to anon, authenticated;
