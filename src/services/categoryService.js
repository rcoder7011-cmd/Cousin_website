import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Static initial categories as clean fallback
export const FALLBACK_CATEGORIES = [
  { id: 'cat-bedroom', name: 'Bedroom', slug: 'bedroom', display_order: 1, is_active: true },
  { id: 'cat-kitchen', name: 'Kitchen', slug: 'kitchen', display_order: 2, is_active: true },
  { id: 'cat-living-room', name: 'Living Room', slug: 'living-room', display_order: 3, is_active: true },
  { id: 'cat-office', name: 'Office', slug: 'office', display_order: 4, is_active: true },
  { id: 'cat-pop-ceiling', name: 'Pop Ceiling', slug: 'pop-ceiling', display_order: 5, is_active: true },
  { id: 'cat-wardrobe', name: 'Wardrobe', slug: 'wardrobe', display_order: 6, is_active: true },
];

/**
 * Fetch all active categories (ordered by display_order)
 * @returns {Promise<{ data: Array, error: Error | null }>}
 */
export async function getCategories() {
  if (!isSupabaseConfigured) {
    return { data: FALLBACK_CATEGORIES, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug, description, image_url, display_order, is_active')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (err) {
    console.error('[categoryService] Error fetching categories:', err.message);
    return { data: FALLBACK_CATEGORIES, error: err };
  }
}

/**
 * Fetch a single category by slug
 * @param {string} slug
 * @returns {Promise<{ data: Object | null, error: Error | null }>}
 */
export async function getCategoryBySlug(slug) {
  if (!isSupabaseConfigured) {
    const match = FALLBACK_CATEGORIES.find(c => c.slug.toLowerCase() === slug.toLowerCase());
    return { data: match || null, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error(`[categoryService] Error fetching category by slug "${slug}":`, err.message);
    return { data: null, error: err };
  }
}

// ============================================================================
// ADMIN CATEGORY OPERATIONS (Protected by Database RLS)
// ============================================================================

/**
 * Fetch all categories (active & inactive) for admin management
 * @returns {Promise<{ data: Array, error: Error | null }>}
 */
export async function getAllCategoriesAdmin() {
  if (!isSupabaseConfigured) {
    return { data: FALLBACK_CATEGORIES, error: new Error('Supabase is not configured yet.') };
  }

  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (err) {
    console.error('[categoryService] Admin error fetching categories:', err.message);
    return { data: [], error: err };
  }
}

/**
 * Create a new category (Admin only)
 * @param {Object} categoryData
 * @returns {Promise<{ data: Object | null, error: Error | null }>}
 */
export async function createCategory(categoryData) {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase is not configured.') };
  }

  try {
    const { data, error } = await supabase
      .from('categories')
      .insert([categoryData])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error('[categoryService] Error creating category:', err.message);
    return { data: null, error: err };
  }
}

/**
 * Update an existing category (Admin only)
 * @param {string} id - Category UUID
 * @param {Object} updates
 * @returns {Promise<{ data: Object | null, error: Error | null }>}
 */
export async function updateCategory(id, updates) {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase is not configured.') };
  }

  try {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error(`[categoryService] Error updating category ${id}:`, err.message);
    return { data: null, error: err };
  }
}

/**
 * Delete a category (Admin only)
 * @param {string} id - Category UUID
 * @returns {Promise<{ success: boolean, error: Error | null }>}
 */
export async function deleteCategory(id) {
  if (!isSupabaseConfigured) {
    return { success: false, error: new Error('Supabase is not configured.') };
  }

  try {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true, error: null };
  } catch (err) {
    console.error(`[categoryService] Error deleting category ${id}:`, err.message);
    return { success: false, error: err };
  }
}

