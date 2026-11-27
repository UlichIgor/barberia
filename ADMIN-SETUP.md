# YARO BARBERIA — Configuración del panel de administración

La interfaz de administración está disponible en `/#/admin` en GitHub Pages (o en `/admin` durante el desarrollo local). Utiliza Supabase Auth, políticas RLS de Postgres y Supabase Storage.

## Configuración necesaria

1. Crea un proyecto independiente de Supabase llamado **BARBERIA**. No utilices los proyectos Delivery ni Kitchen-shop.
2. Ejecuta las migraciones en este orden:
   - `supabase/migrations/202611240001_barberia_bookings.sql`
   - `supabase/migrations/202611270001_admin_panel.sql`
   - `supabase/migrations/202611270002_align_booking_timezone.sql`
3. En Supabase Authentication, crea el usuario del barbero con correo electrónico y contraseña.
4. Asigna el rol de administrador a ese usuario desde el editor SQL (sustituye el correo):

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email = 'MASTER_EMAIL_HERE';
```

5. Cierra sesión e inicia sesión de nuevo para que el JWT incluya el atributo seguro `app_metadata.role`.
6. Copia la URL del proyecto y la clave publicable en el archivo `.env`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

7. Instala las dependencias e inicia el servidor:

```bash
npm install
npm run dev
```

Para GitHub Pages, añade ambos valores como secretos de Actions con los nombres `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`. La URL del panel publicado es `https://ulichigor.github.io/BARBERIA/#/admin`.

## Seguridad

- Nunca incluyas una clave `service_role` ni una clave secreta de Supabase en la aplicación React.
- La autorización de administrador se valida mediante el atributo seguro `app_metadata.role` del JWT. Cambiar `user_metadata`, editable por el usuario, no concede permisos de administrador.
- Los visitantes pueden enviar opiniones con estado `pending` y solo pueden leer las opiniones publicadas.
- Los visitantes pueden consultar servicios activos y elementos publicados de la galería, pero no pueden acceder a los datos de citas/clientes ni administrar contenido.
- Las reservas permanecen visibles únicamente para administradores. La política inicial solo permite insertar solicitudes con estado `pending`.
