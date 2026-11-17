import { isSupabaseConfigured } from '../lib/supabase';

/**
 * Saifi Interior Hub - Backend & Demo Mode Configuration
 * Official Domain: https://saifiinteriorhub.in
 *
 * Centralizes the system's operational mode and inventory.
 * Guarantees zero fake credentials, zero scattered configuration,
 * and transparent local persistence when live credentials are unset.
 */

export const BACKEND_CONFIG = {
  appName: 'Saifi Interior Hub',
  domain: 'https://saifiinteriorhub.in',
  mode: isSupabaseConfigured ? 'live' : 'demo',
  isDemoMode: !isSupabaseConfigured,
  isLiveMode: isSupabaseConfigured,

  persistence: {
    projects: 'saifi_projects_cache_v1',
    categories: 'saifi_categories_cache_v1',
    media: 'saifi_media_cache_v1',
    settings: 'saifi_site_settings_cache_v1',
    authSession: 'saifi_demo_admin_session_v1',
  },

  features: {
    publicPortfolio: {
      status: 'ready',
      source: isSupabaseConfigured ? 'Supabase Database (projects, categories)' : 'Local static dataset + browser cache fallback',
    },
    adminAuthentication: {
      status: 'ready',
      source: isSupabaseConfigured ? 'Supabase Auth + admin_profiles RLS' : 'Demo Mode studio administrator session',
    },
    projectManagement: {
      status: 'ready',
      source: isSupabaseConfigured ? 'Supabase Database (projects, project_images)' : 'Local browser storage (saifi_projects_cache_v1)',
    },
    categoryManagement: {
      status: 'ready',
      source: isSupabaseConfigured ? 'Supabase Database (categories)' : 'Local browser storage (saifi_categories_cache_v1)',
    },
    mediaLibrary: {
      status: 'ready',
      source: isSupabaseConfigured ? 'Supabase Storage (project-images, category-images)' : 'Local browser storage (saifi_media_cache_v1) + static gallery',
    },
    websiteSettings: {
      status: 'ready',
      source: isSupabaseConfigured ? 'Supabase Database (site_settings)' : 'Local browser storage (saifi_site_settings_cache_v1)',
    },
  },

  demoDisclaimer: 'The website is currently operating in Demo Mode. All modifications in the Admin Dashboard are saved locally to your browser and will persist across reloads. No external database credentials are required. To connect to your production Supabase database, refer to DEMO_TO_LIVE_MIGRATION.md.'
};

export default BACKEND_CONFIG;
