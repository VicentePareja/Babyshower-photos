-- Quiniela v2: apuesta por color de ojos + resultado real con ranking.
-- Pegar en Supabase → SQL Editor → Run.

-- 1) Nueva apuesta: ojos claros u oscuros
alter table public.predicciones
  add column if not exists ojos text check (ojos in ('claro', 'oscuro'));

-- 2) Resultado real (una sola fila). Sin políticas RLS: solo el service
--    role (las rutas /api) puede leerla y escribirla, así nadie espía el
--    resultado antes de que se publique.
create table if not exists public.quiniela_resultado (
  id integer primary key default 1 check (id = 1),
  publicado boolean not null default false,
  ojos text check (ojos in ('claro', 'oscuro')),
  peso_gramos integer,
  fecha_real date,
  actualizado_at timestamptz not null default now()
);

alter table public.quiniela_resultado enable row level security;
