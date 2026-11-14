import React, { useState, useEffect, useCallback } from 'react';
import { AuthContext } from './authContextDef';
import {
  checkAdminAuthorization,
  loginAdmin,
  logoutAdmin,
  onAuthStateChange
} from '../services/authService';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Re-usable verification callback
  const refreshAuth = useCallback(async () => {
    try {
      const authState = await checkAdminAuthorization();
      setUser(authState.user);
      setProfile(authState.profile);
      setIsAdmin(authState.isAdmin);
      setAuthError(null);
    } catch (err) {
      console.error('[AuthContext] Error checking auth:', err);
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function initialCheck() {
      try {
        const authState = await checkAdminAuthorization();
        if (isMounted) {
          setUser(authState.user);
          setProfile(authState.profile);
          setIsAdmin(authState.isAdmin);
          setAuthError(null);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('[AuthContext] Error checking auth:', err);
        if (isMounted) {
          setUser(null);
          setProfile(null);
          setIsAdmin(false);
          setIsLoading(false);
        }
      }
    }

    initialCheck();

    // Subscribe to auth state events (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED)
    const { unsubscribe } = onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
        setIsLoading(false);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        const authState = await checkAdminAuthorization();
        if (isMounted) {
          setUser(authState.user);
          setProfile(authState.profile);
          setIsAdmin(authState.isAdmin);
          setIsLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Login handler
  const login = async (email, password) => {
    setAuthError(null);
    const result = await loginAdmin(email, password);

    if (result.error) {
      setAuthError(result.error.message);
      return { success: false, error: result.error };
    }

    setUser(result.user);
    setProfile(result.profile);
    setIsAdmin(true);
    return { success: true, user: result.user, profile: result.profile };
  };

  // Logout handler
  const logout = async () => {
    const { error } = await logoutAdmin();
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
    return { success: !error, error };
  };

  const value = {
    user,
    profile,
    isAdmin,
    isLoading,
    authError,
    login,
    logout,
    refreshAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
