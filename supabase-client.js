// Fill these in with your Supabase project's values (Project Settings -> API).
// The anon key is meant to be public; access control is enforced by Postgres
// Row Level Security policies (see supabase/schema.sql), not by keeping this secret.
const SUPABASE_URL = 'https://vdnaqxfzybysvgphytkg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_h3ycg1LjUqC_3CGwEFYorw_TXaul5_I';

let supabaseClient = null;

if (SUPABASE_URL.startsWith('https://YOUR-PROJECT-REF') || SUPABASE_ANON_KEY === 'YOUR-ANON-PUBLIC-KEY') {
  console.warn('Supabase is not configured yet. Edit supabase-client.js with your project URL and anon key.');
} else if (typeof window.supabase !== 'undefined') {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
