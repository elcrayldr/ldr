import { SUPABASE_URL, SUPABASE_ANON } from './supabaseConfig.js';
// ESM import directo desde CDN
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: { persistSession: false }
});

export async function submitScore(name, score){
  // upsert por nombre: guarda solo el mejor score de ese nombre
  const { data, error } = await supabase
    .from('scores')
    .upsert({ name, score }, { onConflict: 'name' })
    .select();
  if(error) console.error(error);
  return { data, error };
}

export async function getTop(limit=10){
  const { data, error } = await supabase
    .from('scores')
    .select('name, score, created_at')
    .order('score', { ascending: false })
    .limit(limit);
  if(error) console.error(error);
  return data || [];
}
