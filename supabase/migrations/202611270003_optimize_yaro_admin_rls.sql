-- BARBERIA: consolidate public/admin RLS policies and cache JWT role checks.
-- Public content remains visible as published/active; admin can manage all rows.
-- Appointment personal data remains admin-only.

drop policy if exists "Public can read active services" on public.barber_services;
drop policy if exists "YARO admins manage all services" on public.barber_services;
create policy "Read active services or admin all" on public.barber_services
  for select to anon, authenticated
  using (active = true or (select auth.jwt())->'app_metadata'->>'role' = 'admin');
create policy "YARO admins insert services" on public.barber_services
  for insert to authenticated
  with check ((select auth.jwt())->'app_metadata'->>'role' = 'admin');
create policy "YARO admins update services" on public.barber_services
  for update to authenticated
  using ((select auth.jwt())->'app_metadata'->>'role' = 'admin')
  with check ((select auth.jwt())->'app_metadata'->>'role' = 'admin');
create policy "YARO admins delete services" on public.barber_services
  for delete to authenticated
  using ((select auth.jwt())->'app_metadata'->>'role' = 'admin');

drop policy if exists "YARO admins read all appointments" on public.barber_appointments;
drop policy if exists "YARO admins update appointments" on public.barber_appointments;
drop policy if exists "YARO admins delete appointments" on public.barber_appointments;
create policy "YARO admins read all appointments" on public.barber_appointments
  for select to authenticated
  using ((select auth.jwt())->'app_metadata'->>'role' = 'admin');
create policy "YARO admins update appointments" on public.barber_appointments
  for update to authenticated
  using ((select auth.jwt())->'app_metadata'->>'role' = 'admin')
  with check ((select auth.jwt())->'app_metadata'->>'role' = 'admin');
create policy "YARO admins delete appointments" on public.barber_appointments
  for delete to authenticated
  using ((select auth.jwt())->'app_metadata'->>'role' = 'admin');

drop policy if exists "Visitors submit pending YARO reviews" on public.barber_reviews;
drop policy if exists "Public read published YARO reviews" on public.barber_reviews;
drop policy if exists "YARO admins manage reviews" on public.barber_reviews;
create policy "Submit pending or admin review" on public.barber_reviews
  for insert to anon, authenticated
  with check (status = 'pending' or (select auth.jwt())->'app_metadata'->>'role' = 'admin');
create policy "Read published reviews or admin all" on public.barber_reviews
  for select to anon, authenticated
  using (status = 'published' or (select auth.jwt())->'app_metadata'->>'role' = 'admin');
create policy "YARO admins update reviews" on public.barber_reviews
  for update to authenticated
  using ((select auth.jwt())->'app_metadata'->>'role' = 'admin')
  with check ((select auth.jwt())->'app_metadata'->>'role' = 'admin');
create policy "YARO admins delete reviews" on public.barber_reviews
  for delete to authenticated
  using ((select auth.jwt())->'app_metadata'->>'role' = 'admin');

drop policy if exists "Public read published YARO portfolio" on public.barber_portfolio;
drop policy if exists "YARO admins manage portfolio" on public.barber_portfolio;
create policy "Read published portfolio or admin all" on public.barber_portfolio
  for select to anon, authenticated
  using (published = true or (select auth.jwt())->'app_metadata'->>'role' = 'admin');
create policy "YARO admins insert portfolio" on public.barber_portfolio
  for insert to authenticated
  with check ((select auth.jwt())->'app_metadata'->>'role' = 'admin');
create policy "YARO admins update portfolio" on public.barber_portfolio
  for update to authenticated
  using ((select auth.jwt())->'app_metadata'->>'role' = 'admin')
  with check ((select auth.jwt())->'app_metadata'->>'role' = 'admin');
create policy "YARO admins delete portfolio" on public.barber_portfolio
  for delete to authenticated
  using ((select auth.jwt())->'app_metadata'->>'role' = 'admin');
