import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { COMPANY_INFO } from '../data/designer.js';

const LOCAL_STORAGE_SETTINGS_KEY = 'saifi_site_settings_cache_v1';

/**
 * Default official settings for Saifi Interior Hub (10+ Years Experience)
 */
export const DEFAULT_SETTINGS = {
  general_settings: {
    website_name: 'Saifi Interior Hub',
    tagline: 'Over a decade of creating beautiful, functional, and thoughtfully designed spaces.',
    description: "Saifi Interior Hub creates beautiful, functional and inspiring interior spaces tailored to clients' needs.",
    logo_url: '/Website_Logo.png',
    favicon_url: '/Website_Logo.png',
    default_language: 'en',
    contact_email: 'saifiinteriorhub@gmail.com',
    maintenance_mode: false
  },

  business_info: {
    business_name: 'Saifi Interior Hub',
    description: 'Saifi Interior Hub brings over 10 years of experience in interior design and interior work across Gurugram, Delhi, and Noida with direct on-site supervision, transparent execution, and lasting quality.',
    years_of_experience: '10+',
    address: 'Delhi NCR',
    city: 'New Delhi',
    state: 'Delhi',
    postal_code: '110001',
    country: 'India',
    business_email: 'saifiinteriorhub@gmail.com',
    business_phone: '+91 84498 02502',
    whatsapp_number: '918449802502',
    working_hours: 'Mon – Sat: 9:00 AM – 8:00 PM (Sunday Closed)'
  },

  contact_info: {
    primary_phone: '+91 84498 02502',
    secondary_phone: '',
    whatsapp_number: '918449802502',
    email: 'saifiinteriorhub@gmail.com',
    address: 'Gurugram • Delhi • Noida (Delhi NCR, India)',
    google_maps_url: 'https://maps.google.com/?q=Delhi+NCR',
    contact_description: 'Connect directly with Saifi Interior Hub for on-site visits, architectural space discussions, and transparent cost estimates across Gurugram, Delhi, and Noida.'
  },

  social_media: {
    instagram: 'https://instagram.com/saifiinteriorhub',
    facebook: 'https://facebook.com/saifiinteriorhub',
    youtube: '',
    pinterest: '',
    linkedin: ''
  },

  homepage_content: {
    hero_heading: 'Crafting Thoughtful Interiors with Direct Site Execution',
    hero_subtitle: 'With over 10 years of experience in interior design and interior work, Saifi Interior Hub pairs refined aesthetic vision with a dedicated team of master craftsmen across Gurugram, Delhi, and Noida.',
    hero_btn_text: 'View Completed Sites',
    hero_btn_link: '/projects',
    hero_secondary_btn_text: 'Enquire on WhatsApp',
    hero_secondary_btn_link: '',
    hero_image: '/images/projects/Living Room/78d10c45-348b-4c86-90f8-942b36a10bc9.png',
    experience_heading: 'A Proven Decade of Craftsmanship and Direct On-Site Supervision',
    experience_description: 'Over 10 years of dedicated interior execution across Delhi NCR. Master carpenters, POP artisans, and finishing technicians working cohesively under direct supervision.',
    experience_number: '10',
    experience_label: 'Years of Transforming Spaces',
    about_heading: 'About Saifi Interior Hub',
    about_description: 'Saifi Interior Hub delivers turnkey interior design and precision interior execution with direct on-site management and zero intermediaries.',
    about_image: '/images/projects/Living Room/78d10c45-348b-4c86-90f8-942b36a10bc9.png',
    services_heading: 'Specialized Interior Execution Services',
    services_description: 'Precision craftsmanship across modular woodwork, false ceilings, lighting, and turnkey solutions.',
    cta_heading: 'Have a Flat, Villa or Commercial Site Ready for Work?',
    cta_description: 'Connect directly with Saifi Interior Hub (saifiinteriorhub.in). Benefit from more than 10 years of on-site execution experience with transparent estimates.',
    cta_btn_text: 'Chat Directly on WhatsApp',
    cta_btn_link: ''
  },

  seo_settings: {
    meta_title: 'Saifi Interior Hub | Interior Design and Interior Work • 10+ Years Experience - Delhi NCR',
    meta_description: 'Saifi Interior Hub has over 10 years of experience in interior design and interior work across Gurugram, Delhi, and Noida. Direct site supervision with dedicated master craftsmen.',
    meta_keywords: 'interior design, interior work, Saifi Interior Hub, modular kitchen, pop ceiling, wardrobe, Delhi NCR, Gurugram interiors, Noida interiors',
    og_title: 'Saifi Interior Hub | Interior Design and Interior Work • 10+ Years Experience',
    og_description: 'Saifi Interior Hub has over 10 years of experience in interior design and interior work across Delhi NCR. Direct site supervision by experienced craftsmen.',
    og_image: 'https://saifiinteriorhub.in/images/projects/Living%20Room/78d10c45-348b-4c86-90f8-942b36a10bc9.png',
    twitter_image: 'https://saifiinteriorhub.in/images/projects/Living%20Room/78d10c45-348b-4c86-90f8-942b36a10bc9.png',
    canonical_url: 'https://saifiinteriorhub.in',
    robots_index: 'index, follow',
    page_seo: {
      home: {
        title: 'Saifi Interior Hub | Interior Design & Execution • 10+ Years Exp',
        description: 'Over a decade of creating bespoke interiors across Gurugram, Delhi, and Noida with direct site supervision.'
      },
      about: {
        title: 'About Us | Saifi Interior Hub - 10+ Years Experience',
        description: 'Learn about Saifi Interior Hub, our 10+ years of interior craftsmanship and direct on-site execution.'
      },
      services: {
        title: 'Our Services | Saifi Interior Hub',
        description: 'Turnkey interior design services including modular woodwork, false ceiling, painting and electrical solutions.'
      },
      projects: {
        title: 'Completed Projects | Saifi Interior Hub Portfolio',
        description: 'Explore real completed interior design projects executed by Saifi Interior Hub across Delhi NCR.'
      },
      contact: {
        title: 'Contact Us | Saifi Interior Hub Consultation',
        description: 'Get in touch for on-site interior design consultations and estimates in Gurugram, Delhi, and Noida.'
      }
    }
  },

  footer_settings: {
    footer_description: 'With over 10 years of experience in interior design and interior work, Saifi Interior Hub focuses on creating beautiful, functional, and thoughtfully designed residential and commercial spaces across Gurugram, Delhi, and Noida with direct on-site supervision.',
    copyright_text: '© {year} Saifi Interior Hub. All Rights Reserved.',
    footer_address: 'Gurugram • Delhi • Noida',
    footer_phone: '+91 84498 02502',
    footer_email: 'saifiinteriorhub@gmail.com',
    show_social: true
  },

  advanced_settings: {
    maintenance_mode: false,
    maintenance_message: 'We are currently updating our portfolio. Please contact us on WhatsApp at +91 84498 02502 for immediate enquiries.',
    default_language: 'en',
    custom_head_code: ''
  }
};

let inMemorySettingsStore = null;

/**
 * Retrieve cached settings from localStorage or fall back to DEFAULT_SETTINGS
 */
function getFallbackSettingsStore() {
  if (inMemorySettingsStore) return inMemorySettingsStore;

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          inMemorySettingsStore = deepMerge(DEFAULT_SETTINGS, parsed);
          return inMemorySettingsStore;
        }
      }
    } catch (err) {
      console.warn('[settingsService] Error reading localStorage settings cache:', err);
    }
  }

  inMemorySettingsStore = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  return inMemorySettingsStore;
}

/**
 * Persist fallback settings to localStorage
 */
function saveFallbackSettingsStore(settings) {
  inMemorySettingsStore = settings;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(settings));
    } catch (err) {
      console.warn('[settingsService] Error saving settings to localStorage:', err);
    }
  }
}

/**
 * Deep merge helper
 */
function deepMerge(target, source) {
  const output = { ...target };
  if (!source || typeof source !== 'object') return output;

  Object.keys(source).forEach(key => {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      key in target &&
      typeof target[key] === 'object' &&
      !Array.isArray(target[key])
    ) {
      output[key] = deepMerge(target[key], source[key]);
    } else {
      output[key] = source[key];
    }
  });

  return output;
}

/**
 * Email validation helper
 */
export function validateEmail(email) {
  if (!email || !email.trim()) return true; // empty allowed if optional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Phone validation helper (accepts standard international or national formats)
 */
export function validatePhone(phone) {
  if (!phone || !phone.trim()) return true;
  return /^[+]?[\d\s-]{7,20}$/.test(phone.trim());
}

/**
 * URL validation helper
 */
export function validateUrl(url) {
  if (!url || !url.trim()) return true;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate an individual settings section
 * @param {string} sectionKey
 * @param {Object} values
 * @returns {{ isValid: boolean, errors: Object }}
 */
export function validateSettingsSection(sectionKey, values) {
  const errors = {};

  if (sectionKey === 'general_settings') {
    if (!values.website_name || !values.website_name.trim()) {
      errors.website_name = 'Website name is required.';
    }
    if (values.contact_email && !validateEmail(values.contact_email)) {
      errors.contact_email = 'Invalid email address format.';
    }
  } else if (sectionKey === 'business_info') {
    if (!values.business_name || !values.business_name.trim()) {
      errors.business_name = 'Business name is required.';
    }
    if (values.business_email && !validateEmail(values.business_email)) {
      errors.business_email = 'Invalid business email format.';
    }
    if (values.business_phone && !validatePhone(values.business_phone)) {
      errors.business_phone = 'Invalid phone number format.';
    }
  } else if (sectionKey === 'contact_info') {
    if (values.email && !validateEmail(values.email)) {
      errors.email = 'Invalid contact email format.';
    }
    if (values.primary_phone && !validatePhone(values.primary_phone)) {
      errors.primary_phone = 'Invalid phone number format.';
    }
    if (values.secondary_phone && !validatePhone(values.secondary_phone)) {
      errors.secondary_phone = 'Invalid secondary phone format.';
    }
    if (values.google_maps_url && !validateUrl(values.google_maps_url)) {
      errors.google_maps_url = 'Invalid Google Maps URL (must start with http:// or https://).';
    }
  } else if (sectionKey === 'social_media') {
    ['instagram', 'facebook', 'youtube', 'pinterest', 'linkedin'].forEach(k => {
      if (values[k] && !validateUrl(values[k])) {
        errors[k] = `Invalid ${k} profile URL (must start with http:// or https://).`;
      }
    });
  } else if (sectionKey === 'seo_settings') {
    if (!values.meta_title || !values.meta_title.trim()) {
      errors.meta_title = 'Default Meta Title is required.';
    }
    if (values.canonical_url && !validateUrl(values.canonical_url)) {
      errors.canonical_url = 'Invalid canonical URL format.';
    }
    if (values.og_image && !validateUrl(values.og_image) && !values.og_image.startsWith('/')) {
      errors.og_image = 'OG Image must be a valid URL or path.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Fetch all website settings, merging database rows over default fallback settings.
 * @returns {Promise<{ data: Object, error: Error | null }>}
 */
export async function getAllSettings() {
  if (!isSupabaseConfigured) {
    const store = getFallbackSettingsStore();
    return { data: store, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('setting_key, setting_value, updated_at');

    if (error) throw error;

    const merged = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));

    if (Array.isArray(data)) {
      data.forEach(row => {
        if (row.setting_key && row.setting_value) {
          if (merged[row.setting_key] && typeof merged[row.setting_key] === 'object') {
            merged[row.setting_key] = deepMerge(merged[row.setting_key], row.setting_value);
          } else {
            merged[row.setting_key] = row.setting_value;
          }
        }
      });
    }

    // Save in local storage cache for rapid subsequent initializations
    saveFallbackSettingsStore(merged);

    return { data: merged, error: null };
  } catch (err) {
    console.warn('[settingsService] Fallback to cached settings:', err.message);
    const store = getFallbackSettingsStore();
    return { data: store, error: err };
  }
}

/**
 * Fetch a single site setting section by its key
 * @param {string} sectionKey
 * @returns {Promise<{ data: Object | null, error: Error | null }>}
 */
export async function getSettingByKey(sectionKey) {
  const { data: allSettings, error } = await getAllSettings();
  if (error && !allSettings) return { data: null, error };
  return { data: allSettings[sectionKey] || DEFAULT_SETTINGS[sectionKey] || null, error: null };
}

/**
 * Update a specific settings section (Admin only).
 * Also maintains backward compatibility with legacy `company_info` key.
 *
 * @param {string} sectionKey
 * @param {Object} value
 * @returns {Promise<{ data: Object | null, error: Error | null }>}
 */
export async function saveSettingSection(sectionKey, value) {
  if (!sectionKey) {
    return { data: null, error: new Error('Settings key is required.') };
  }

  // Update fallback cache
  const store = getFallbackSettingsStore();
  store[sectionKey] = value;
  saveFallbackSettingsStore(store);

  if (!isSupabaseConfigured) {
    return { data: value, error: null };
  }

  try {
    const { error: upsertError } = await supabase
      .from('site_settings')
      .upsert({
        setting_key: sectionKey,
        setting_value: value,
        updated_at: new Date().toISOString()
      }, { onConflict: 'setting_key' });

    if (upsertError) throw upsertError;

    // Synchronize legacy `company_info` if business, contact or general was updated
    if (['business_info', 'contact_info', 'general_settings'].includes(sectionKey)) {
      const business = store.business_info || DEFAULT_SETTINGS.business_info;
      const contact = store.contact_info || DEFAULT_SETTINGS.contact_info;
      const general = store.general_settings || DEFAULT_SETTINGS.general_settings;

      const legacyCompanyInfo = {
        name: business.business_name || general.website_name || COMPANY_INFO.name,
        domain: COMPANY_INFO.domain,
        website_url: COMPANY_INFO.websiteUrl,
        industry: COMPANY_INFO.industry,
        experience: `${business.years_of_experience || '10+'} Years Experience`,
        years_of_experience: parseInt(business.years_of_experience, 10) || 10,
        phone: contact.primary_phone || business.business_phone || COMPANY_INFO.contact.phone,
        whatsapp_number: contact.whatsapp_number || business.whatsapp_number || COMPANY_INFO.contact.whatsappNumber,
        email: contact.email || business.business_email || COMPANY_INFO.contact.email,
        service_areas: COMPANY_INFO.serviceAreas
      };

      await supabase
        .from('site_settings')
        .upsert({
          setting_key: 'company_info',
          setting_value: legacyCompanyInfo,
          updated_at: new Date().toISOString()
        }, { onConflict: 'setting_key' });
    }

    return { data: value, error: null };
  } catch (err) {
    console.error(`[settingsService] Error saving setting section "${sectionKey}":`, err.message);
    return { data: null, error: err };
  }
}

/**
 * Reset a section to its official company defaults
 * @param {string} sectionKey
 * @returns {Promise<{ data: Object, error: Error | null }>}
 */
export async function resetSectionToDefault(sectionKey) {
  const defaultValue = DEFAULT_SETTINGS[sectionKey];
  if (!defaultValue) {
    return { data: null, error: new Error(`No default configured for "${sectionKey}".`) };
  }

  return saveSettingSection(sectionKey, JSON.parse(JSON.stringify(defaultValue)));
}

// Backwards-compatible aliases
export const getSiteSettings = getAllSettings;
export const updateSetting = saveSettingSection;
