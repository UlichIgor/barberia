-- Keep database booking validation in the same local timezone used by the booking UI.
-- Existing installs may have the original auto-named schedule CHECK constraint.
alter table public.barber_appointments
  drop constraint if exists barber_appointments_check1;

alter table public.barber_appointments
  drop constraint if exists barber_appointments_business_hours_check;

alter table public.barber_appointments
  add constraint barber_appointments_business_hours_check check (
    extract(isodow from starts_at at time zone 'Europe/Kyiv') between 1 and 5
    and (starts_at at time zone 'Europe/Kyiv')::time >= time '09:00'
    and (ends_at at time zone 'Europe/Kyiv')::time <= time '19:00'
    and extract(minute from starts_at at time zone 'Europe/Kyiv') in (0,30)
    and extract(second from starts_at at time zone 'Europe/Kyiv') = 0
  );
