import { supabase, isSupabaseConfigured } from '../lib/supabase';

const DEMO_AUTH_SESSION_KEY = 'saifi_demo_admin_session_v1';

/**
 * Log in an authorized administrator using Email & Password.
 * Performs a two-tier check:
 * 1. Authenticates credentials against Supabase Auth (or Demo Mode local persistence).
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
  const cleanEmail = String(email || '').trim().toLowerCase();

  if (!cleanEmail || !password) {
    return {
      user: null,
      session: null,
      profile: null,
      error: new Error('Both email and password are required.')
    };
  }

  // 1. DEMO MODE FALLBACK (When Supabase credentials are not configured)
  if (!isSupabaseConfigured) {
    const demoUser = {
      id: 'demo-admin-0000-0000-000000000001',
      email: cleanEmail,
      app_metadata: { provider: 'demo' },
      user_metadata: { full_name: 'Studio Administrator' }
    };
    const demoProfile = {
      id: demoUser.id,
      full_name: 'Studio Administrator',
      role: 'admin',
      created_at: new Date().toISOString()
    };
    const demoSession = {
      user: demoUser,
      access_token: 'demo-local-session-token',
      expires_at: Math.floor(Date.now() / 1000) + 86400 * 7
    };

    try {
      localStorage.setItem(DEMO_AUTH_SESSION_KEY, JSON.stringify({
        user: demoUser,
        profile: demoProfile,
        session: demoSession
      }));
    } catch {
      // ignore storage failure in private mode
    }

    return {
      user: demoUser,
      session: demoSession,
      profile: demoProfile,
      error: null
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
    try {
      localStorage.removeItem(DEMO_AUTH_SESSION_KEY);
    } catch {
      // ignore
    }
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
  if (!isSupabaseConfigured) {
    try {
      const raw = localStorage.getItem(DEMO_AUTH_SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed?.user || null;
      }
    } catch {
      return null;
    }
    return null;
  }

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
    try {
      const raw = localStorage.getItem(DEMO_AUTH_SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return { data: parsed?.profile || null, error: null };
      }
    } catch {
      return { data: null, error: null };
    }
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
    try {
      const raw = localStorage.getItem(DEMO_AUTH_SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.user && parsed?.profile?.role === 'admin') {
          return {
            isAuthenticated: true,
            isAdmin: true,
            user: parsed.user,
            profile: parsed.profile
          };
        }
      }
    } catch (e) {
      console.warn('[authService] Error reading demo auth session:', e);
    }
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
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!cleanEmail) {
    return { success: false, error: new Error('Email address is required.') };
  }

  if (!isSupabaseConfigured) {
    return {
      success: true,
      error: null,
      message: 'Demo Mode: Password reset link simulated. Connect live Supabase credentials to deliver production emails.'
    };
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
  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: new Error('Password must be at least 8 characters long.') };
  }

  if (!isSupabaseConfigured) {
    return {
      success: true,
      error: null,
      message: 'Demo Mode: Password update simulated locally.'
    };
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
