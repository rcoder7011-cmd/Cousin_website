import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Log in an authorized admin using Email & Password.
 * (No public signup is provided - admin accounts must be created securely via the Supabase dashboard)
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ user: Object | null, session: Object | null, error: Error | null }>}
 */
export async function loginAdmin(email, password) {
  if (!isSupabaseConfigured) {
    return {
      user: null,
      session: null,
      error: new Error('Supabase is not configured yet. Please provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.')
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) throw error;

    // Verify whether this user has an active admin profile in admin_profiles
    const { data: profile, error: profileError } = await supabase
      .from('admin_profiles')
      .select('id, full_name, role')
      .eq('id', data.user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (profileError || !profile) {
      // User is authenticated but NOT an authorized admin -> sign them out immediately
      await supabase.auth.signOut();
      return {
        user: null,
        session: null,
        error: new Error('Access denied: Your account does not have authorized admin privileges.')
      };
    }

    return { user: data.user, session: data.session, error: null };
  } catch (err) {
    console.error('[authService] Login error:', err.message);
    return { user: null, session: null, error: err };
  }
}

/**
 * Log out the currently authenticated admin
 * @returns {Promise<{ error: Error | null }>}
 */
export async function logoutAdmin() {
  if (!isSupabaseConfigured) {
    return { error: null };
  }

  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (err) {
    console.error('[authService] Logout error:', err.message);
    return { error: err };
  }
}

/**
 * Retrieve the current active user from the active Supabase session
 * @returns {Promise<Object | null>}
 */
export async function getCurrentUser() {
  if (!isSupabaseConfigured) return null;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user || null;
  } catch (err) {
    console.error('[authService] Get current user error:', err.message);
    return null;
  }
}

/**
 * Check whether the current visitor is an authorized admin
 * @returns {Promise<boolean>}
 */
export async function isAdmin() {
  if (!isSupabaseConfigured) return false;

  try {
    const user = await getCurrentUser();
    if (!user) return false;

    const { data: profile, error } = await supabase
      .from('admin_profiles')
      .select('role')
      .eq('id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (error || !profile) return false;
    return profile.role === 'admin';
  } catch {
    return false;
  }
}

/**
 * Subscribe to Supabase auth state changes (login, logout, token refresh)
 * @param {Function} callback - Callback function receiving (event, session)
 * @returns {{ unsubscribe: Function }}
 */
export function onAuthStateChange(callback) {
  if (!isSupabaseConfigured) {
    return { unsubscribe: () => {} };
  }

  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });

  return {
    unsubscribe: () => subscription?.unsubscribe()
  };
}

