-- Trivia en vivo: "Competencia del Baby Shower de Meli y Vicente".
-- Pegar en Supabase -> SQL Editor -> Run. Idempotente.

-- ----------------------------------------------------------------------------
-- 1) Estado/config del juego (fila única). SIN políticas RLS: solo el service
--    role (rutas /api) la lee/escribe. Contiene las respuestas correctas, por
--    eso nunca debe ser legible por anon.
-- ----------------------------------------------------------------------------
create table if not exists public.trivia_juego (
  id integer primary key default 1 check (id = 1),
  nombre text not null default 'Competencia del Baby Shower de Meli y Vicente',
  descripcion text not null default '',
  pin text not null default '1234',
  estado text not null default 'cerrado'
    check (estado in ('cerrado','lobby','pregunta','revelado','pausa','podio')),
  pregunta_idx integer not null default -1,
  pregunta_inicio timestamptz,
  resto_ms integer,
  config jsonb not null default '{}'::jsonb,
  preguntas jsonb not null default '[]'::jsonb,
  actualizado_at timestamptz not null default now()
);
alter table public.trivia_juego enable row level security;

-- ----------------------------------------------------------------------------
-- 2) Pulso público: espejo del estado live SIN secretos. anon puede leerlo y
--    se publica por Realtime; el cliente lo escucha y al cambiar `version`
--    refetchea el estado sanitizado vía /api/trivia/estado.
-- ----------------------------------------------------------------------------
create table if not exists public.trivia_pulso (
  id integer primary key default 1 check (id = 1),
  estado text not null default 'cerrado',
  pregunta_idx integer not null default -1,
  pregunta_inicio timestamptz,
  version bigint not null default 0,
  actualizado_at timestamptz not null default now()
);
alter table public.trivia_pulso enable row level security;

drop policy if exists "anon lee pulso" on public.trivia_pulso;
create policy "anon lee pulso" on public.trivia_pulso
  for select to anon using (true);

-- ----------------------------------------------------------------------------
-- 3) Jugadores. anon puede leerlos (host muestra nombres/puntajes); las
--    escrituras pasan siempre por el service role (rutas /api).
-- ----------------------------------------------------------------------------
create table if not exists public.trivia_jugadores (
  id uuid primary key,
  pin text not null,
  nombre text not null,
  puntaje integer not null default 0,
  racha integer not null default 0,
  mejor_racha integer not null default 0,
  conectado boolean not null default true,
  expulsado boolean not null default false,
  creado_at timestamptz not null default now(),
  visto_at timestamptz not null default now()
);
alter table public.trivia_jugadores enable row level security;

drop policy if exists "anon lee jugadores" on public.trivia_jugadores;
create policy "anon lee jugadores" on public.trivia_jugadores
  for select to anon using (true);

-- ----------------------------------------------------------------------------
-- 4) Respuestas. SIN políticas anon: solo el service role. Así nadie puede
--    espiar correctitud/puntos antes del reveal. El unique evita cambiar la
--    respuesta una vez enviada (anti-trampa a nivel de BD).
-- ----------------------------------------------------------------------------
create table if not exists public.trivia_respuestas (
  id uuid primary key default gen_random_uuid(),
  jugador_id uuid not null references public.trivia_jugadores(id) on delete cascade,
  pregunta_id text not null,
  pregunta_idx integer not null,
  respuesta jsonb,
  correcto boolean not null default false,
  fraccion real not null default 0,
  puntos integer not null default 0,
  ms integer not null default 0,
  creado_at timestamptz not null default now(),
  unique (jugador_id, pregunta_idx)
);
alter table public.trivia_respuestas enable row level security;

-- ----------------------------------------------------------------------------
-- 5) Realtime: publica solo las tablas públicas (pulso + jugadores).
-- ----------------------------------------------------------------------------
do $$
begin
  begin
    alter publication supabase_realtime add table public.trivia_pulso;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.trivia_jugadores;
  exception when duplicate_object then null;
  end;
end $$;
