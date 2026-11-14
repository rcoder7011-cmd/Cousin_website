import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Log in an authorized administrator using Email & Password.
 * Performs a two-tier check:
 * 1. Authenticates credentials against Supabase Auth.
 * 2. Verifies that the authenticated user exists in the `admin_profiles` database table
 *    with role = 'admin'.
 * If the user is authenticated but lacks admin authorization, their session is immediately
 * terminated and an explicit authorization error is returned.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ user: Object | null, session: Object | null, profile: Object | null, error: Error | null }>}
 */
export async function loginAdmin(email, password) {
  if (!isSupabaseConfigured) {
    return {
      user: null,
      session: null,
      profile: null,
      error: new Error('Supabase backend is not configured yet. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.')
    };
  }

  const cleanEmail = String(email || '').trim().toLowerCase();

  if (!cleanEmail || !password) {
    return {
      user: null,
      session: null,
      profile: null,
      error: new Error('Both email and password are required.')
    };
  }

  try {
    // 1. Supabase Auth credential verification
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (authError) throw authError;

    if (!authData.user) {
      throw new Error('Authentication succeeded but user record was not returned.');
    }

    // 2. Database-backed Authorization check (Never trust client-supplied metadata)
    const { data: profile, error: profileError } = await supabase
      .from('admin_profiles')
      .select('id, full_name, role, created_at')
      .eq('id', authData.user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (profileError) {
      console.error('[authService] Profile lookup error:', profileError.message);
      await supabase.auth.signOut();
      return {
        user: null,
        session: null,
        profile: null,
        error: new Error('Authorization check failed. Please ensure your admin_profiles record is configured in Supabase.')
      };
    }

    if (!profile) {
      // User is authenticated via Supabase, but NOT an authorized admin in admin_profiles
      await supabase.auth.signOut();
      return {
        user: null,
        session: null,
        profile: null,
        error: new Error('Access Denied: This account does not possess authorized administrator privileges for Saifi Interior Hub.')
      };
    }

    return {
      user: authData.user,
      session: authData.session,
      profile,
      error: null
    };

  } catch (err) {
    console.error('[authService] Login failure:', err.message);
    // User-friendly error message mapping
    let userMessage = err.message || 'Unable to log in. Please check your credentials.';
    if (err.message?.includes('Invalid login credentials')) {
      userMessage = 'Invalid email address or password. Please try again.';
    } else if (err.message?.includes('Email not confirmed')) {
      userMessage = 'Email address has not been confirmed in Supabase Auth.';
    }
    return { user: null, session: null, profile: null, error: new Error(userMessage) };
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
 * Fetch the admin_profile record for a specific user ID
 * @param {string} userId
 * @returns {Promise<{ data: Object | null, error: Error | null }>}
 */
export async function getAdminProfile(userId) {
  if (!isSupabaseConfigured || !userId) {
    return { data: null, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('admin_profiles')
      .select('id, full_name, role, created_at')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error(`[authService] Error fetching admin profile for ${userId}:`, err.message);
    return { data: null, error: err };
  }
}

/**
 * Comprehensive authorization check for the active visitor.
 * Verifies both active session AND database admin_profiles membership.
 *
 * @returns {Promise<{ isAuthenticated: boolean, isAdmin: boolean, user: Object | null, profile: Object | null }>}
 */
export async function checkAdminAuthorization() {
  if (!isSupabaseConfigured) {
    return { isAuthenticated: false, isAdmin: false, user: null, profile: null };
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user) {
      return { isAuthenticated: false, isAdmin: false, user: null, profile: null };
    }

    const { data: profile } = await getAdminProfile(session.user.id);
    const isAdminUser = Boolean(profile && profile.role === 'admin');

    return {
      isAuthenticated: true,
      isAdmin: isAdminUser,
      user: session.user,
      profile: profile || null
    };
  } catch (err) {
    console.error('[authService] Error checking admin authorization:', err.message);
    return { isAuthenticated: false, isAdmin: false, user: null, profile: null };
  }
}

/**
 * Send password recovery email via Supabase Auth
 * Redirects the admin back to `/admin/reset-password`
 *
 * @param {string} email
 * @returns {Promise<{ success: boolean, error: Error | null }>}
 */
export async function sendPasswordResetEmail(email) {
  if (!isSupabaseConfigured) {
    return {
      success: false,
      error: new Error('Supabase is not configured yet. Please configure your .env file.')
    };
  }

  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!cleanEmail) {
    return { success: false, error: new Error('Email address is required.') };
  }

  try {
    const siteUrl = window.location.origin;
    const redirectUrl = `${siteUrl}/admin/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: redirectUrl,
    });

    if (error) throw error;
    return { success: true, error: null };
  } catch (err) {
    console.error('[authService] Password reset request error:', err.message);
    return { success: false, error: err };
  }
}

/**
 * Update the password for the current recovery session
 * @param {string} newPassword
 * @returns {Promise<{ success: boolean, error: Error | null }>}
 */
export async function updateAdminPassword(newPassword) {
  if (!isSupabaseConfigured) {
    return { success: false, error: new Error('Supabase is not configured.') };
  }

  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: new Error('Password must be at least 8 characters long.') };
  }

  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
    return { success: true, error: null };
  } catch (err) {
    console.error('[authService] Password update error:', err.message);
    return { success: false, error: err };
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
