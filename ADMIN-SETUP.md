# YARO BARBERIA — Admin panel setup

The admin UI is available at `/#/admin` on GitHub Pages (or `/admin` in a local dev server). It uses Supabase Auth, Postgres RLS and Supabase Storage; it does not use browser-only localStorage for admin data.

## Required setup

1. Create a **separate Supabase project named BARBERIA**. Do not use the existing Delivery or Kitchen-shop projects.
2. Apply migrations in order:
   - `supabase/migrations/202611240001_barberia_bookings.sql`
   - `supabase/migrations/202611270001_admin_panel.sql`
   - `supabase/migrations/202611270002_align_booking_timezone.sql`
3. In Supabase Authentication, create the master's user with email/password.
4. Promote that exact Auth user to admin from the SQL editor (replace the email):

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email = 'MASTER_EMAIL_HERE';
```

5. Sign out and sign back in so the JWT contains the new trusted `app_metadata.role` claim.
6. Copy the project's Project URL and publishable key into `.env`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

7. Install and run:

```bash
npm install
npm run dev
```

Open `/admin` to sign in. For GitHub Pages, add both values as repository Actions secrets named `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`; the included workflow injects them during build. The deployed admin URL is `https://ulichigor.github.io/BARBERIA/#/admin`.

## Security notes

- Never put a Supabase `service_role` or secret key in the React app.
- Admin authorization is enforced by RLS against the trusted JWT `app_metadata.role` claim; changing user-editable `user_metadata` does not grant admin rights.
- Public visitors can submit reviews with `pending` status and can only read published reviews.
- Public visitors can read active services and published portfolio rows; they cannot read appointment/client data or manage content.
- Appointment rows remain visible to admins only. Public booking inserts remain pending-only under the first migration.
