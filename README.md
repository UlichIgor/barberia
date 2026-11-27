# BARBERIA — YARO BARBER

Sitio web de barbería desarrollado con React, Vite, React Router, HTML5 y CSS3. Incluye Inicio, Servicios, Sobre mí y Reservas, además del panel privado de administración.

## Desarrollo local
```bash
npm install
npm run dev
```
Compilar para producción: `npm run build`.

## Horario actual
De lunes a viernes, de 09:00 a 19:00. Sábados y domingos cerrado. Los horarios de inicio de las citas avanzan en intervalos de 30 minutos.

## Servicios y precios
El catálogo y los precios de `src/data/services.js` se basan en la ficha de Barbershop Yaro en Booksy y se muestran en euros. Comprueba la ficha de Booksy antes de publicar cambios de precios.

## Galería
La página «Sobre mí» muestra fotografías de cortes de pelo en una galería adaptable con ampliación de imágenes. El barbero puede gestionar nuevas imágenes desde el panel de administración.

## Backend
Se necesita un backend independiente de Supabase para gestionar reservas, servicios, galería y opiniones. Configura el archivo `.env` usando `.env.example` después de crear el proyecto BARBERIA. Sin estas variables, la página de reservas funciona en modo de demostración local y el panel muestra las instrucciones de configuración.

## Opiniones
Los visitantes pueden enviar opiniones. Estas quedan en estado `pending` hasta que el barbero las revise y publique desde `/#/admin`.

## Panel de administración
- Acceso: `https://ulichigor.github.io/BARBERIA/#/admin`.
- Gestión de reservas y estados, precios y duración de servicios, fotografías de la galería y moderación de opiniones.
- La autorización se basa en el atributo seguro `app_metadata.role = admin` de Supabase Auth.
- Aplica las migraciones SQL en el orden indicado en `ADMIN-SETUP.md`.

## Publicación en GitHub Pages
El repositorio se publica desde `main` mediante GitHub Actions. La aplicación usa la ruta base `/BARBERIA/` y rutas hash para que la navegación funcione correctamente en GitHub Pages.

En GitHub → Settings → Secrets and variables → Actions, añade los secretos `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`. No incluyas nunca una clave `service_role` ni claves secretas en el frontend.
