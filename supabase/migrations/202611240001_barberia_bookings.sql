-- BARBERIA booking schema
-- Apply only to a dedicated BARBERIA Supabase project, never to Kitchen-shop/Delivery.
create schema if not exists extensions;
create extension if not exists btree_gist;
alter extension btree_gist set schema extensions;

create table if not exists public.barber_services (
  id text primary key,
  name text not null,
  duration_minutes integer not null check (duration_minutes > 0 and duration_minutes <= 240),
  price numeric(8,2) not null check (price >= 0),
  active boolean not null default true
);

insert into public.barber_services (id, name, duration_minutes, price) values
('cut','Corte caballero',30,20),('beard-trim','Recorte de la barba',30,15),('shave-head','Rapado',15,15),
('modern','Corte Moderno',40,25),('beard-shave','Afeitado De Barba',30,20),('senior','Corte Jubilado',30,15),
('fade','Corte Fade',30,20),('beard-care','Cuidado de la Barba',30,15),('combo','Corte Pelo + Barba',60,30),
('kid','Corte Niño Hasta 8 Años',30,15),('zero','Corte a Zero',15,10),('nose-wax','Waxing nariz',5,5)
on conflict (id) do nothing;

create table if not exists public.barber_appointments (
  id uuid primary key default gen_random_uuid(),
  service_id text not null references public.barber_services(id),
  client_name text not null check (char_length(trim(client_name)) between 2 and 100),
  client_phone text not null check (char_length(trim(client_phone)) between 7 and 30),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'pending'
    check (status in ('pending','confirmed','cancelled','completed')),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (
    extract(isodow from starts_at at time zone 'Europe/Kyiv') between 1 and 5
    and (starts_at at time zone 'Europe/Kyiv')::time >= time '09:00'
    and (ends_at at time zone 'Europe/Kyiv')::time <= time '19:00'
    and extract(minute from starts_at at time zone 'Europe/Kyiv') in (0,30)
    and extract(second from starts_at at time zone 'Europe/Kyiv') = 0
  ),
  exclude using gist (
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status in ('pending','confirmed'))
);

create index if not exists barber_appointments_starts_at_idx
  on public.barber_appointments (starts_at);

alter table public.barber_services enable row level security;
alter table public.barber_appointments enable row level security;

-- Public visitors may see only active services, never appointment/client data.
drop policy if exists "Public can read active services" on public.barber_services;
create policy "Public can read active services"
  on public.barber_services for select to anon, authenticated
  using (active = true);

-- Public booking submission only. No anonymous SELECT/UPDATE/DELETE.
drop policy if exists "Visitors can request appointments" on public.barber_appointments;
create policy "Visitors can request appointments"
  on public.barber_appointments for insert to anon, authenticated
  with check (status = 'pending');

grant select on public.barber_services to anon, authenticated;
grant insert on public.barber_appointments to anon, authenticated;
revoke all on public.barber_appointments from anon;

-- Re-grant only INSERT after revoking all; authenticated owner/admin access is
-- intentionally not enabled until the master account and role policy are configured.
grant insert on public.barber_appointments to anon, authenticated;
