# El bosque de Octavio 🍄

Landing mobile-first para el baby shower de Octavio, con temática de bosque
encantado. Los invitados escanean un QR, suben fotos y dejan mensajes; todo
queda guardado en Supabase como recuerdo.

**El QR impreso apunta a `https://octavio-parejamiranda.com/subir`. Esa ruta
existe tal cual (`app/subir/page.tsx`): no la renombres.**

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v4
- Supabase: Postgres (mensajes y predicciones) + Storage (bucket `fotos`)
- Deploy en Vercel

## Rutas

| Ruta | Qué hace |
| --- | --- |
| `/` | Landing con contadores en vivo y accesos a todo |
| `/subir` | **Destino del QR.** Cámara/galería, compresión client-side, subida |
| `/galeria` | Grid de fotos con lightbox y auto-refresh |
| `/deseos-bebe` | Cápsula del tiempo: deseos que leerá Octavio |
| `/mensajes-padres` | Mensajes para Vicente y Melani |
| `/quiniela` | (extra, flag) predicciones de peso, fecha y nombre |
| `/slideshow` | (extra, flag) carrusel fullscreen para proyectar en TV |
| `/trivia` | (extra, flag) **jugador**: entra con PIN + nombre y juega desde el celular |
| `/trivia/host` | (extra, flag) **proyección**: PIN+QR, pregunta, timer, ranking y podio |
| `/admin` | Panel privado: recuerdos + **sección Trivia** (preguntas, ajustes y control en vivo) |

Los extras se apagan en `lib/flags.ts` sin tocar nada más.

## Trivia en vivo (Kahoot del bosque)

Trivia multijugador para el evento presencial. Tres vistas:

- **Jugador** (`/trivia`, mobile-first): entra con PIN + nombre, responde y ve
  su feedback (puntos, racha, posición). Reconecta solo si se cae el wifi
  (guarda su id en `localStorage`).
- **Host** (`/trivia/host`, proyector): muestra PIN + QR para unirse, la
  pregunta, el cronómetro, cuántos respondieron, la distribución y el ranking;
  al final, podio de los 3 primeros. Si abriste sesión en `/admin` **en el mismo
  navegador**, aparece arriba una barra para controlar la partida.
- **Admin** (`/admin` → sección *Trivia*): pestañas **En vivo** (abrir lobby,
  iniciar, siguiente, mostrar resultados, pausar, saltar, terminar, reiniciar,
  reset total, expulsar/renombrar jugadores, exportar CSV/JSON), **Preguntas**
  (CRUD, reordenar, activar/desactivar) y **Ajustes** (timer, puntaje, racha,
  PIN, sonidos/animaciones).

### Realtime y arquitectura

- **Supabase Realtime** (no Socket.IO): el sitio vive en Vercel serverless, así
  que un servidor WebSocket propio no encaja. Reusa el Supabase que ya está.
- Única fuente de verdad en la BD: la tabla `trivia_juego` (con las respuestas
  correctas, **solo accesible por el service role**). Una tabla pública
  `trivia_pulso` espeja el estado *sin secretos* y se publica por Realtime; el
  cliente la escucha y refetchea el estado sanitizado.
- **Anti-trampa**: el servidor valida el tiempo (no el reloj del cliente), las
  respuestas correctas nunca viajan al cliente antes del *reveal*, y un `unique`
  en BD impide cambiar la respuesta una vez enviada.
- Soporta ~100 jugadores simultáneos sin servidor extra.

### SQL para Supabase (¡requerido!)

Pega `db/trivia.sql` en **Supabase → SQL Editor → Run** una sola vez. Crea las
tablas (`trivia_juego`, `trivia_pulso`, `trivia_jugadores`, `trivia_respuestas`),
las policies RLS y la publicación de Realtime. Sin esto, el juego no persiste.

Las 15 preguntas viven en `lib/trivia/preguntas.ts` como seed editable; al
guardarlas desde el panel quedan en `trivia_juego.preguntas`.

> **Para probar la partida** en local o producción: corre `db/trivia.sql`, entra
> a `/admin`, abre la sección *Trivia → En vivo → Abrir lobby → Iniciar*, y
> proyecta `/trivia/host`. Los invitados escanean el QR (apunta a `/trivia?pin=…`).

## Instalación

```bash
bun install        # o npm install
cp .env.example .env.local
# completa las variables (ver abajo)
bun run dev        # o npm run dev → http://localhost:3000
```

## Variables de entorno

| Variable | Dónde se usa | Dónde encontrarla |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | cliente y servidor | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | cliente | Supabase → Settings → API (`anon public`) |
| `SUPABASE_SERVICE_ROLE_KEY` | **solo servidor** (borrar/exportar) | Supabase → Settings → API (`service_role`) |
| `ADMIN_PASSWORD` | **solo servidor** (login de `/admin`) | la inventas tú |

`SUPABASE_SERVICE_ROLE_KEY` y `ADMIN_PASSWORD` nunca llegan al navegador: solo
se leen en route handlers (`app/api/admin/*`) y `lib/supabase-admin.ts` importa
`server-only` para que el build falle si alguien lo importa desde el cliente.

## SQL para Supabase

Si las tablas/policies ya existen con este esquema, no hace falta correr nada.
Si partes de cero, pega esto en el **SQL Editor** de Supabase:

```sql
-- ---------- Tablas ----------
create table if not exists public.mensajes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  destinatario text not null check (destinatario in ('bebe', 'padres')),
  autor text,
  cuerpo text not null check (char_length(cuerpo) between 1 and 2000)
);

create table if not exists public.fotos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  autor text,
  ruta text not null,
  caption text
);

create table if not exists public.predicciones (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  autor text,
  sexo text,
  peso_gramos int check (peso_gramos between 500 and 7000),
  fecha_estimada date,
  nombre_sugerido text
);

-- ---------- RLS ----------
alter table public.mensajes enable row level security;
alter table public.fotos enable row level security;
alter table public.predicciones enable row level security;

-- Invitados (anon): pueden leer e insertar. Borrar/editar solo service role.
create policy "anon lee mensajes" on public.mensajes
  for select to anon using (true);
create policy "anon escribe mensajes" on public.mensajes
  for insert to anon with check (destinatario in ('bebe', 'padres'));

create policy "anon lee fotos" on public.fotos
  for select to anon using (true);
create policy "anon escribe fotos" on public.fotos
  for insert to anon with check (true);

create policy "anon lee predicciones" on public.predicciones
  for select to anon using (true);
create policy "anon escribe predicciones" on public.predicciones
  for insert to anon with check (true);
```

### Bucket de Storage

1. Supabase → Storage → **New bucket** → nombre `fotos`, marca **Public bucket**.
2. Policies del bucket (SQL Editor):

```sql
-- Invitados pueden subir al bucket 'fotos'
create policy "anon sube fotos" on storage.objects
  for insert to anon
  with check (bucket_id = 'fotos');

-- Lectura pública (el bucket es público, esto cubre la API)
create policy "lectura publica fotos" on storage.objects
  for select to anon
  using (bucket_id = 'fotos');
```

El borrado de archivos no tiene policy para `anon`: solo lo hace el servidor
con el service role (que salta RLS).

## Deploy en Vercel

1. El repo ya está conectado; basta con hacer push a `main`.
2. En Vercel → Project → **Settings → Environment Variables**, agrega las 4
   variables de `.env.example` (en Production y Preview).
3. Redeploy. Verifica `https://octavio-parejamiranda.com/subir` desde el
   celular escaneando el QR real.

## Panel /admin

- Entra con `ADMIN_PASSWORD`; la sesión dura 8 horas (cookie httpOnly firmada).
- Puedes borrar fotos (archivo + fila), mensajes y predicciones.
- **Descargar todo** genera un ZIP con:
  - `fotos/` (todas las imágenes originales del bucket)
  - `mensajes.json` y `predicciones.json`
  - `capsula-del-tiempo.html`: los deseos para Octavio en formato lindo,
    listo para imprimir o guardar como PDF (Ctrl+P → Guardar como PDF).

## Notas anti-spam y rendimiento

- Honeypot invisible en todos los formularios; los bots "envían" pero no se
  guarda nada.
- Las imágenes se comprimen en el cliente (máx 1600 px de lado largo, JPEG)
  antes de subir: pensado para la red lenta del evento.
- Validación de tipo (`image/*`) y tamaño máximo (25 MB pre-compresión).
