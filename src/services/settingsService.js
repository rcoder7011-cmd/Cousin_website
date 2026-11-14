import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { COMPANY_INFO } from '../data/designer';

/**
 * Fetch all site settings from the site_settings table
 * @returns {Promise<{ data: Object, error: Error | null }>}
 */
export async function getSiteSettings() {
  if (!isSupabaseConfigured) {
    return {
      data: {
        company_info: {
          name: COMPANY_INFO.name,
          domain: COMPANY_INFO.domain,
          phone: COMPANY_INFO.contact.phone,
          email: COMPANY_INFO.contact.email,
          experience: COMPANY_INFO.experience,
          years_of_experience: COMPANY_INFO.yearsOfExperience,
        }
      },
      error: null
    };
  }

  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('setting_key, setting_value');

    if (error) throw error;

    const settingsMap = {};
    (data || []).forEach(row => {
      settingsMap[row.setting_key] = row.setting_value;
    });

    return { data: settingsMap, error: null };
  } catch (err) {
    console.error('[settingsService] Error fetching site settings:', err.message);
    return { data: {}, error: err };
  }
}

/**
 * Fetch a single site setting by its key
 * @param {string} key
 * @returns {Promise<{ data: any, error: Error | null }>}
 */
export async function getSettingByKey(key) {
  if (!isSupabaseConfigured) {
    if (key === 'company_info') {
      return {
        data: {
          name: COMPANY_INFO.name,
          domain: COMPANY_INFO.domain,
          phone: COMPANY_INFO.contact.phone,
          email: COMPANY_INFO.contact.email,
          experience: COMPANY_INFO.experience,
        },
        error: null
      };
    }
    return { data: null, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('setting_value')
      .eq('setting_key', key)
      .single();

    if (error) throw error;
    return { data: data ? data.setting_value : null, error: null };
  } catch (err) {
    console.error(`[settingsService] Error fetching setting "${key}":`, err.message);
    return { data: null, error: err };
  }
}

/**
 * Update or insert a site setting (Admin only)
 * @param {string} key
 * @param {any} value
 * @returns {Promise<{ success: boolean, error: Error | null }>}
 */
export async function updateSetting(key, value) {
  if (!isSupabaseConfigured) {
    return { success: false, error: new Error('Supabase is not configured.') };
  }

  try {
    const { error } = await supabase
      .from('site_settings')
      .upsert({
        setting_key: key,
        setting_value: value,
        updated_at: new Date().toISOString()
      }, { onConflict: 'setting_key' });

    if (error) throw error;
    return { success: true, error: null };
  } catch (err) {
    console.error(`[settingsService] Error updating setting "${key}":`, err.message);
    return { success: false, error: err };
  }
}
