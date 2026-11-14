import { useContext } from 'react';
import { AuthContext } from './authContextDef';

/**
 * Custom hook to access admin authentication state and actions
 * @returns {{ user, profile, isAdmin, isLoading, authError, login, logout, refreshAuth }}
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
