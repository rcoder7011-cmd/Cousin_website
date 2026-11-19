/**
 * Saifi Interior Hub — Centralized Admin Route Architecture
 * Official Domain: saifiinteriorhub.in
 *
 * Security Note:
 * The admin portal route has been obfuscated from the generic '/admin' path
 * to '/nimda-portal'. All internal navigation, guards, and redirects reference
 * these constants to guarantee consistency.
 */

export const ADMIN_BASE_PATH = '/nimda-portal';

export const ADMIN_ROUTES = {
  BASE: ADMIN_BASE_PATH,
  LOGIN: `${ADMIN_BASE_PATH}/login`,
  FORGOT_PASSWORD: `${ADMIN_BASE_PATH}/forgot-password`,
  RESET_PASSWORD: `${ADMIN_BASE_PATH}/reset-password`,
  DASHBOARD: `${ADMIN_BASE_PATH}/dashboard`,
  PROJECTS: `${ADMIN_BASE_PATH}/projects`,
  PROJECTS_NEW: `${ADMIN_BASE_PATH}/projects/new`,
  PROJECT_EDIT: (id) => `${ADMIN_BASE_PATH}/projects/${id}/edit`,
  CATEGORIES: `${ADMIN_BASE_PATH}/categories`,
  CATEGORIES_NEW: `${ADMIN_BASE_PATH}/categories/new`,
  CATEGORY_EDIT: (id) => `${ADMIN_BASE_PATH}/categories/${id}/edit`,
  MEDIA: `${ADMIN_BASE_PATH}/media`,
  SETTINGS: `${ADMIN_BASE_PATH}/settings`,
};

export default ADMIN_ROUTES;
