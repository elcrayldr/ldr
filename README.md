# Cray Runner — Online Leaderboard (gratis con Supabase)
Menú + nombre + puntuación + **ranking global online** con Supabase.

## 1) Crear proyecto Supabase (gratis)
1. Ve a https://supabase.com → Start project.
2. Crea un proyecto (free tier). Copia **Project URL** y **anon public key** (Settings → API).
3. En `src/scene/supabaseConfig.js` pega tus valores:
   ```js
   export const SUPABASE_URL  = 'https://TU-PROYECTO.supabase.co';
   export const SUPABASE_ANON = 'TU-ANON-KEY';
   ```

## 2) Tabla y políticas (SQL)
En Supabase → SQL Editor pega y ejecuta:

```sql
create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 16),
  score integer not null check (score >= 0),
  created_at timestamptz default now()
);

-- Mejor score por nombre (upsert)
create unique index if not exists scores_name_key on public.scores (name);

alter table public.scores enable row level security;

-- Permitir leer top a todos (anon)
create policy "scores_select_public"
on public.scores for select
to anon
using (true);

-- Permitir upsert a todos (anon)
create policy "scores_upsert_public"
on public.scores for insert
to anon
with check (true);

create policy "scores_update_public"
on public.scores for update
to anon
using (true)
with check (true);
```

> Nota: estas políticas son abiertas para simplicidad (competición casual). Para evitar trampas, mira **Anti‑cheat** abajo.

## 3) Ejecutar local / publicar
- Local: doble clic en `index.html`.
- Publicar: Vercel/Netlify → Importa carpeta → listo.

## 4) Config rápida del juego
- Carriles: `config.js` → `LANES`.
- Dificultad: `BASE_SPAWN_MS`, `downSpeed()`, estrellas.
- Puntuación: `SCORE_PER_KILL`, `SCORE_PER_SECOND`.

## 5) Anti‑cheat (opcional, recomendado si habrá premios)
**Sencillo (sin servidor):**
- “Mejor por nombre” con `upsert` ya limita spam del mismo nick.
- Puedes moderar borrando records falsos en Supabase.

**Más serio (gratis):**
- Crea una **Edge Function** en Supabase (usa Service Role en el servidor, **nunca** en el cliente).
- Endpoint `/submitScore` valida payload (p. ej., límite 1 envío/30s por IP si la función lo permite) y hace el `upsert`.
- En el juego llamas a la función en vez de `from('scores').upsert`.

Ejemplo mínimo de función (TypeScript):
```ts
// supabase/functions/submit-score/index.ts
import { serve } from 'https://deno.land/std/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
serve(async (req) => {
  const { name, score } = await req.json()
  if(!name || typeof score !== 'number' || score<0) return new Response('Bad request', { status: 400 })
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SUPABASE_SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE')! // secreto
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE)
  const { error } = await supabase.from('scores').upsert({ name: String(name).slice(0,16), score })
  if(error) return new Response(error.message, { status: 500 })
  return new Response('OK', { status: 200 })
})
```
Desplegar: `supabase functions deploy submit-score` y en **API URL** usa `fetch(...)` desde el juego.

## 6) Cambiar estética
Sustituye sprites en `preload()` por PNGs en `/assets` y listo.

¡Ya puedes hacer torneos y dar premios al top! 💥
