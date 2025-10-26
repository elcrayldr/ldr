// src/supabaseClient.js
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const SUPABASE_URL = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imttbm93bHd5b2R0ZHdyc2plYWlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NTc2MTYsImV4cCI6MjA3NzAzMzYxNn0.PotpYnRiu7lj1Hs1pQa8qeuI13ryN1lJWnXDQGd-6hc";
export const SUPABASE_ANON_KEY = "YOUR-ANON-KEY";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false }
});

export async function submitScore(name, score) {
  if (!name || typeof score !== 'number') return;
  const { error } = await supabase.from('scores').insert({ name, score });
  if (error) throw error;
}

export async function fetchTop(limit = 10) {
  const { data, error } = await supabase
    .from('scores')
    .select('name,score,created_at')
    .order('score', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

