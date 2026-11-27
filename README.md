# BARBERIA — YARO BARBER
React + Vite + React Router + HTML5/CSS3. Four pages: Home, Services, About, Booking.
## Run locally
```bash
npm install
npm run dev
```
Build: `npm run build`.
## Confirmed schedule
Monday–Saturday, 09:00–20:00; Sunday closed; appointment start interval 30 minutes.
## Booksy source
Service catalog and prices in `src/data/services.js` are transcribed from Barbershop Yaro's Booksy listing in EUR. Check the live Booksy page before production if prices change.
## Portfolio
Booksy displays a gallery, but direct original image URLs were not exposed in the page extraction available during this update. About page links to the original Booksy portfolio rather than falsely labeling unrelated stock photos as the barber's work. Add original images to `public/images/portfolio/` when available.
## Backend
A dedicated Supabase backend is required for shared live bookings, managed services, portfolio and moderated reviews. Configure `.env` using `.env.example` after creating the separate BARBERIA project; until then the booking page remains in local demo mode and the admin page displays setup instructions.

## Master portfolio
Four user-provided haircut photographs are stored in `public/images/portfolio/` and shown on the About page in a responsive gallery with a click-to-enlarge lightbox.

## Portfolio management and reviews
The public About page reads published portfolio images and approved reviews from Supabase. New reviews enter `pending` status for moderation in `/admin`.

## Homepage poster update (2026-11-27)
The homepage hero now uses the newly supplied BARBERSHOP interior poster image at `public/images/barber-hero.jpg`. The image is optimized as JPEG for web delivery; responsive hero positioning, dark readability overlay, and booking CTA remain in place.

## YARO logo
The supplied YARO Barbershop emblem is included as `public/images/yaro-logo-original.png` and optimized `public/images/yaro-logo.webp`. It appears in the site header, footer, and browser tab favicon.


## YARO admin panel
- Open `/admin` for the protected YARO management workspace.
- Manage appointments and statuses, service prices/durations, portfolio uploads/publication, and review moderation.
- Public booking, active service catalog, published portfolio, and approved reviews are wired to Supabase when environment variables are configured.
- Apply `supabase/migrations/202611270001_admin_panel.sql` after the initial booking migration. See `ADMIN-SETUP.md` for secure admin provisioning and deployment instructions.
- The admin route intentionally refuses access unless the signed-in Supabase user has the trusted `app_metadata.role = admin` claim.


## GitHub Pages deployment
This repository deploys automatically from `main` using GitHub Actions. The Vite base path is `/BARBERIA/` and routes use hash URLs, so direct refreshes work on GitHub Pages.

In GitHub repository Settings → Secrets and variables → Actions, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` as repository secrets before deploying the live booking/admin backend. Without these values, the site builds in demo mode and the admin panel displays setup instructions.
