import { createClient } from '@supabase/supabase-js';

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' && process.env ? process.env : {});
const rawUrl = env.VITE_SUPABASE_URL?.trim() || '';
// Clean up trailing slash and accidental /rest/v1/ paths
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY?.trim() || '';

/**
 * Checks whether valid Supabase configuration is present.
 * Prevents throwing errors when credentials have not yet been provided by the user.
 */
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  supabaseAnonKey !== 'your-anon-publishable-key-here' &&
  supabaseUrl.startsWith('http')
);

if (!isSupabaseConfigured && env.DEV) {
  console.info(
    '[Supabase] Backend credentials not configured yet. Using fallback mock/static data.\n' +
    'To connect your live database, copy .env.example to .env and provide your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.\n' +
    'Refer to docs/SUPABASE_SETUP_GUIDE.md for setup instructions.'
  );
}

// Fallback dummy credentials to allow safe client creation without runtime import crashes
const safeUrl = isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co';
const safeKey = isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key';

export const supabase = createClient(safeUrl, safeKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

