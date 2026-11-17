import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { PROJECTS as STATIC_PROJECTS } from '../data/projects.js';
import {
  resolveImageUrl,
  extractStoragePathFromUrl,
  deleteStorageFiles,
  MAX_FILE_SIZE_BYTES,
  ALLOWED_MIME_TYPES
} from './projectImageService.js';

export const CATEGORY_STORAGE_BUCKET = 'category-images';

// Initial suggested room categories per Part 9 specification
export const INITIAL_SUGGESTED_CATEGORIES = [
  {
    name: 'Bedroom',
    slug: 'bedroom',
    description: 'Master and guest bedroom interior spaces, bespoke beds, and mood lighting.',
    image_url: '/images/categories/bedroom.jpg',
    display_order: 1,
    is_active: true
  },
  {
    name: 'Kitchen',
    slug: 'kitchen',
    description: 'Modular kitchen layouts, acrylic & laminate cabinetry, and quartz countertops.',
    image_url: '/images/categories/kitchen.jpg',
    display_order: 2,
    is_active: true
  },
  {
    name: 'Living Room',
    slug: 'living-room',
    description: 'Architectural living room spaces, media walls, acoustic wall panelling.',
    image_url: '/images/categories/living-room.jpg',
    display_order: 3,
    is_active: true
  },
  {
    name: 'Office',
    slug: 'office',
    description: 'Corporate workspaces, executive cabins, acoustic ceilings, and conference setups.',
    image_url: '/images/categories/office.jpg',
    display_order: 4,
    is_active: true
  },
  {
    name: 'Pop Ceiling',
    slug: 'pop-ceiling',
    description: 'Gypsum board false ceilings, cove indirect lighting, and CNC cut designs.',
    image_url: '/images/categories/pop-ceiling.jpg',
    display_order: 5,
    is_active: true
  },
  {
    name: 'Wardrobe',
    slug: 'wardrobe',
    description: 'Floor-to-ceiling sliding & openable wardrobes with lacquered glass and vanity mirrors.',
    image_url: '/images/categories/wardrobe.jpg',
    display_order: 6,
    is_active: true
  }
];

export const FALLBACK_CATEGORIES = INITIAL_SUGGESTED_CATEGORIES.map((c, i) => ({
  ...c,
  id: `cat-${c.slug}`,
  created_at: new Date(Date.now() - (6 - i) * 86400000 * 5).toISOString(),
  updated_at: new Date(Date.now() - (6 - i) * 86400000 * 2).toISOString()
}));

const LOCAL_STORAGE_KEY = 'saifi_admin_categories_store';
let inMemoryFallbackStore = null;

function getFallbackCategoriesStore() {
  if (inMemoryFallbackStore) {
    return inMemoryFallbackStore;
  }
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          inMemoryFallbackStore = parsed;
          return inMemoryFallbackStore;
        }
      }
    } catch (err) {
      console.warn('[categoryService] Error reading localStorage fallback categories:', err);
    }
  }
  inMemoryFallbackStore = [...FALLBACK_CATEGORIES];
  return inMemoryFallbackStore;
}

function saveFallbackCategoriesStore(cats) {
  inMemoryFallbackStore = cats;
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cats));
  } catch (err) {
    console.warn('[categoryService] Error saving localStorage fallback categories:', err);
  }
}

/**
 * Fetch active categories for public website filters and project detail views.
 *
 * @param {Object} [options]
 * @param {boolean} [options.includeInactive=false] - If true, returns both active and inactive
 * @returns {Promise<{ data: Array, error: Error | null }>}
 */
export async function getCategories({ includeInactive = false } = {}) {
  if (!isSupabaseConfigured) {
    let result = getFallbackCategoriesStore();
    if (!includeInactive) {
      result = result.filter(c => c.is_active);
    }
    result.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    return { data: result, error: null };
  }

  try {
    let query = supabase
      .from('categories')
      .select('id, name, slug, description, image_url, display_order, is_active, created_at, updated_at')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw error;

    if (!data || data.length === 0) {
      let result = getFallbackCategoriesStore();
      if (!includeInactive) {
        result = result.filter(c => c.is_active);
      }
      return { data: result, error: null };
    }

    const formatted = data.map(c => ({
      ...c,
      image_url: resolveImageUrl(c.image_url)
    }));

    return { data: formatted, error: null };
  } catch (err) {
    console.error('[categoryService] Error fetching categories:', err.message);
    let result = getFallbackCategoriesStore();
    if (!includeInactive) {
      result = result.filter(c => c.is_active);
    }
    return { data: result, error: err };
  }
}

/**
 * Fetch a single category by slug
 * @param {string} slug
 * @returns {Promise<{ data: Object | null, error: Error | null }>}
 */
export async function getCategoryBySlug(slug) {
  if (!slug) return { data: null, error: new Error('Slug parameter is required.') };

  const cleanSlug = String(slug).toLowerCase().trim();

  if (!isSupabaseConfigured) {
    const list = getFallbackCategoriesStore();
    const match = list.find(c => c.slug.toLowerCase() === cleanSlug);
    return { data: match || null, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', cleanSlug)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      const list = getFallbackCategoriesStore();
      const match = list.find(c => c.slug.toLowerCase() === cleanSlug);
      return { data: match || null, error: null };
    }

    return {
      data: {
        ...data,
        image_url: resolveImageUrl(data.image_url)
      },
      error: null
    };
  } catch (err) {
    console.error(`[categoryService] Error fetching category by slug "${cleanSlug}":`, err.message);
    const list = getFallbackCategoriesStore();
    const match = list.find(c => c.slug.toLowerCase() === cleanSlug);
    return { data: match || null, error: err };
  }
}

// ============================================================================
// ADMIN CATEGORY OPERATIONS (Protected by Database RLS & is_admin())
// ============================================================================

/**
 * Fetch all categories with real project counts for the Admin Dashboard.
 * Includes search, filtering, and sorting.
 *
 * @param {Object} [options]
 * @param {string} [options.search='']
 * @param {string} [options.status='all'] - 'all' | 'active' | 'inactive'
 * @param {string} [options.projectFilter='all'] - 'all' | 'with_projects' | 'without_projects'
 * @param {string} [options.sortBy='order'] - 'order' | 'newest' | 'oldest' | 'alphabetical' | 'most_projects'
 * @returns {Promise<{ data: Array, count: number, error: Error | null }>}
 */
export async function getAdminCategories({
  search = '',
  status = 'all',
  projectFilter = 'all',
  sortBy = 'order'
} = {}) {
  // Static fallback when Supabase is not configured
  if (!isSupabaseConfigured) {
    const store = getFallbackCategoriesStore();
    let items = store.map(c => {
      const assignedCount = STATIC_PROJECTS.filter(p =>
        (p.category && p.category.toLowerCase() === c.name.toLowerCase()) ||
        (p.category && p.category.toLowerCase() === c.slug.toLowerCase())
      ).length;

      return {
        ...c,
        image_url: resolveImageUrl(c.image_url),
        projects_count: assignedCount
      };
    });

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q)
      );
    }

    if (status === 'active') {
      items = items.filter(c => c.is_active);
    } else if (status === 'inactive') {
      items = items.filter(c => !c.is_active);
    }

    if (projectFilter === 'with_projects') {
      items = items.filter(c => c.projects_count > 0);
    } else if (projectFilter === 'without_projects') {
      items = items.filter(c => c.projects_count === 0);
    }

    if (sortBy === 'order') {
      items.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    } else if (sortBy === 'newest') {
      items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortBy === 'oldest') {
      items.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else if (sortBy === 'alphabetical') {
      items.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'most_projects') {
      items.sort((a, b) => b.projects_count - a.projects_count);
    }

    return { data: items, count: items.length, error: null };
  }

  try {
    // Primary query attempting relational join
    let query = supabase
      .from('categories')
      .select(`
        id,
        name,
        slug,
        description,
        image_url,
        display_order,
        is_active,
        created_at,
        updated_at,
        projects:projects(count)
      `);

    // Status filter
    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    }

    // Search filter
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(`name.ilike.${term},slug.ilike.${term}`);
    }

    // Base database sorting
    if (sortBy === 'order') {
      query = query.order('display_order', { ascending: true }).order('name', { ascending: true });
    } else if (sortBy === 'newest') {
      query = query.order('created_at', { ascending: false });
    } else if (sortBy === 'oldest') {
      query = query.order('created_at', { ascending: true });
    } else if (sortBy === 'alphabetical') {
      query = query.order('name', { ascending: true });
    }

    let { data, error } = await query;

    // Resilient fallback if PostgREST schema cache fails the relation join
    if (error) {
      console.warn('[categoryService] Relational query projects(count) fallback:', error.message);
      let simpleQuery = supabase
        .from('categories')
        .select('id, name, slug, description, image_url, display_order, is_active, created_at, updated_at');

      if (status === 'active') simpleQuery = simpleQuery.eq('is_active', true);
      if (status === 'inactive') simpleQuery = simpleQuery.eq('is_active', false);
      if (search && search.trim()) {
        const term = `%${search.trim()}%`;
        simpleQuery = simpleQuery.or(`name.ilike.${term},slug.ilike.${term}`);
      }
      if (sortBy === 'order') simpleQuery = simpleQuery.order('display_order', { ascending: true }).order('name', { ascending: true });
      else if (sortBy === 'newest') simpleQuery = simpleQuery.order('created_at', { ascending: false });
      else if (sortBy === 'oldest') simpleQuery = simpleQuery.order('created_at', { ascending: true });
      else if (sortBy === 'alphabetical') simpleQuery = simpleQuery.order('name', { ascending: true });

      const simpleRes = await simpleQuery;
      if (simpleRes.error) throw simpleRes.error;
      data = simpleRes.data || [];

      // Fetch project counts separately
      const { data: projRows } = await supabase.from('projects').select('category_id');
      const countsMap = {};
      (projRows || []).forEach(p => {
        if (p.category_id) {
          countsMap[p.category_id] = (countsMap[p.category_id] || 0) + 1;
        }
      });

      data = data.map(c => ({
        ...c,
        projects: [{ count: countsMap[c.id] || 0 }]
      }));
    }

    let formatted = (data || []).map(row => {
      const count = Array.isArray(row.projects)
        ? (row.projects[0]?.count ?? 0)
        : (row.projects?.count ?? 0);

      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description || '',
        image_url: resolveImageUrl(row.image_url),
        display_order: row.display_order ?? 0,
        is_active: Boolean(row.is_active),
        created_at: row.created_at,
        updated_at: row.updated_at,
        projects_count: count
      };
    });

    // Project count filter
    if (projectFilter === 'with_projects') {
      formatted = formatted.filter(c => c.projects_count > 0);
    } else if (projectFilter === 'without_projects') {
      formatted = formatted.filter(c => c.projects_count === 0);
    }

    // Secondary client sorting for most_projects
    if (sortBy === 'most_projects') {
      formatted.sort((a, b) => b.projects_count - a.projects_count);
    }

    return { data: formatted, count: formatted.length, error: null };
  } catch (err) {
    console.error('[categoryService] Error in getAdminCategories:', err.message);
    return { data: [], count: 0, error: err };
  }
}

/**
 * Fetch a single category by ID for the admin edit form, including assigned projects count.
 *
 * @param {string} id - Category UUID
 * @returns {Promise<{ data: Object | null, error: Error | null }>}
 */
export async function getCategoryByIdAdmin(id) {
  if (!id) return { data: null, error: new Error('Category ID is required.') };

  if (!isSupabaseConfigured) {
    const list = getFallbackCategoriesStore();
    const match = list.find(c => c.id === id || c.slug === id);
    if (!match) return { data: null, error: new Error('Category not found.') };

    const assignedCount = STATIC_PROJECTS.filter(p =>
      (p.category && p.category.toLowerCase() === match.name.toLowerCase()) ||
      (p.category && p.category.toLowerCase() === match.slug.toLowerCase())
    ).length;

    return {
      data: {
        ...match,
        image_url: resolveImageUrl(match.image_url),
        projects_count: assignedCount
      },
      error: null
    };
  }

  try {
    const { data, error } = await supabase
      .from('categories')
      .select(`
        id,
        name,
        slug,
        description,
        image_url,
        display_order,
        is_active,
        created_at,
        updated_at,
        projects:projects(count)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      // Fallback simple query
      const { data: simpleData, error: simpleError } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (simpleError) throw simpleError;
      if (!simpleData) return { data: null, error: new Error('Category not found.') };

      const { count } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', id);

      return {
        data: {
          ...simpleData,
          image_url: resolveImageUrl(simpleData.image_url),
          projects_count: count ?? 0
        },
        error: null
      };
    }

    if (!data) return { data: null, error: new Error('Category not found.') };

    const count = Array.isArray(data.projects)
      ? (data.projects[0]?.count ?? 0)
      : (data.projects?.count ?? 0);

    return {
      data: {
        ...data,
        image_url: resolveImageUrl(data.image_url),
        projects_count: count
      },
      error: null
    };
  } catch (err) {
    console.error(`[categoryService] Error fetching category ${id}:`, err.message);
    return { data: null, error: err };
  }
}

/**
 * Check if a category slug is available.
 *
 * @param {string} slug
 * @param {string} [excludeId] - Category ID to exclude when editing
 * @returns {Promise<{ isAvailable: boolean, error: Error | null }>}
 */
export async function checkCategorySlugAvailability(slug, excludeId = null) {
  if (!slug || !slug.trim()) {
    return { isAvailable: false, error: new Error('Slug cannot be empty.') };
  }

  const cleanSlug = slug.trim().toLowerCase();

  if (!isSupabaseConfigured) {
    const list = getFallbackCategoriesStore();
    const isTaken = list.some(c => c.slug === cleanSlug && c.id !== excludeId);
    return { isAvailable: !isTaken, error: null };
  }

  try {
    let query = supabase
      .from('categories')
      .select('id')
      .eq('slug', cleanSlug);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return {
      isAvailable: !data || data.length === 0,
      error: null
    };
  } catch (err) {
    console.error(`[categoryService] Error checking category slug "${cleanSlug}":`, err.message);
    return { isAvailable: false, error: err };
  }
}

/**
 * Upload an image file for a category to the 'category-images' bucket (with fallback to 'project-images').
 *
 * @param {File} file - Browser File object
 * @param {Object} [options]
 * @param {string} [options.categoryId]
 * @returns {Promise<{ data: { path: string, publicUrl: string } | null, error: Error | null }>}
 */
export async function uploadCategoryImage(file, { categoryId } = {}) {
  if (!file) {
    return { data: null, error: new Error('No image file provided.') };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      data: null,
      error: new Error(`Invalid image type (${file.type}). Allowed types: JPEG, PNG, WebP, SVG.`)
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      data: null,
      error: new Error(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds 10MB limit.`)
    };
  }

  if (!isSupabaseConfigured) {
    return {
      data: { path: `local/${file.name}`, publicUrl: URL.createObjectURL(file) },
      error: null
    };
  }

  try {
    const folder = categoryId || 'general';
    const timestamp = Date.now();
    const cleanFileName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '-')
      .replace(/-+/g, '-');
    const storagePath = `${folder}/${timestamp}-${cleanFileName}`;

    // Attempt upload to dedicated category-images bucket
    let bucketToUse = CATEGORY_STORAGE_BUCKET;
    let { error: uploadError } = await supabase.storage
      .from(bucketToUse)
      .upload(storagePath, file, {
        cacheControl: '31536000',
        upsert: true
      });

    // If category-images bucket doesn't exist yet, fallback to project-images
    if (uploadError && uploadError.message?.toLowerCase().includes('bucket not found')) {
      bucketToUse = 'project-images';
      const fallbackPath = `categories/${storagePath}`;
      const { error: fallbackError } = await supabase.storage
        .from(bucketToUse)
        .upload(fallbackPath, file, {
          cacheControl: '31536000',
          upsert: true
        });

      if (fallbackError) throw fallbackError;

      const { data: urlData } = supabase.storage
        .from(bucketToUse)
        .getPublicUrl(fallbackPath);

      return {
        data: {
          path: fallbackPath,
          publicUrl: urlData.publicUrl
        },
        error: null
      };
    }

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from(bucketToUse)
      .getPublicUrl(storagePath);

    return {
      data: {
        path: storagePath,
        publicUrl: urlData.publicUrl
      },
      error: null
    };
  } catch (err) {
    console.error('[categoryService] Error uploading category image:', err.message);
    return { data: null, error: err };
  }
}

/**
 * Create a new category in Supabase.
 *
 * @param {Object} categoryData
 * @param {File} [imageFile=null]
 * @returns {Promise<{ data: Object | null, error: Error | null }>}
 */
export async function createCategory(categoryData, imageFile = null) {
  if (!isSupabaseConfigured) {
    let imageUrl = categoryData.image_url || null;
    if (imageFile) {
      imageUrl = URL.createObjectURL(imageFile);
    }

    const newCat = {
      id: `cat-${Date.now()}`,
      name: categoryData.name.trim(),
      slug: categoryData.slug.trim().toLowerCase(),
      description: categoryData.description?.trim() || '',
      image_url: imageUrl,
      display_order: parseInt(categoryData.display_order, 10) || 0,
      is_active: categoryData.is_active !== undefined ? Boolean(categoryData.is_active) : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      projects_count: 0
    };

    const store = getFallbackCategoriesStore();
    store.push(newCat);
    saveFallbackCategoriesStore(store);

    return { data: newCat, error: null };
  }

  try {
    let imageUrl = categoryData.image_url || null;

    if (imageFile) {
      const { data: uploadRes, error: uploadErr } = await uploadCategoryImage(imageFile, {
        categoryId: categoryData.slug
      });
      if (uploadErr) throw uploadErr;
      if (uploadRes?.publicUrl) {
        imageUrl = uploadRes.publicUrl;
      }
    }

    const payload = {
      name: categoryData.name.trim(),
      slug: categoryData.slug.trim().toLowerCase(),
      description: categoryData.description?.trim() || null,
      image_url: imageUrl,
      display_order: parseInt(categoryData.display_order, 10) || 0,
      is_active: categoryData.is_active !== undefined ? Boolean(categoryData.is_active) : true
    };

    const { data, error } = await supabase
      .from('categories')
      .insert([payload])
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
 * Update an existing category.
 *
 * @param {string} id - Category UUID
 * @param {Object} categoryData
 * @param {Object} [options]
 * @param {File} [options.newImageFile=null]
 * @param {boolean} [options.removeImage=false]
 * @returns {Promise<{ data: Object | null, error: Error | null }>}
 */
export async function updateCategory(id, categoryData, { newImageFile = null, removeImage = false } = {}) {
  if (!id) return { data: null, error: new Error('Category ID is required.') };

  if (!isSupabaseConfigured) {
    const store = getFallbackCategoriesStore();
    const index = store.findIndex(c => c.id === id);
    if (index === -1) return { data: null, error: new Error('Category not found.') };

    let imageUrl = categoryData.image_url;
    if (removeImage) {
      imageUrl = null;
    } else if (newImageFile) {
      imageUrl = URL.createObjectURL(newImageFile);
    }

    const updated = {
      ...store[index],
      name: categoryData.name.trim(),
      slug: categoryData.slug.trim().toLowerCase(),
      description: categoryData.description?.trim() || '',
      image_url: imageUrl,
      display_order: parseInt(categoryData.display_order, 10) || 0,
      is_active: Boolean(categoryData.is_active),
      updated_at: new Date().toISOString()
    };

    store[index] = updated;
    saveFallbackCategoriesStore(store);

    return { data: updated, error: null };
  }

  try {
    let imageUrl = categoryData.image_url;

    // Remove existing image if requested
    if (removeImage) {
      if (imageUrl) {
        const storagePath = extractStoragePathFromUrl(imageUrl);
        if (storagePath) {
          await deleteStorageFiles([storagePath]);
        }
      }
      imageUrl = null;
    }

    // Upload new image if provided
    if (newImageFile) {
      const { data: uploadRes, error: uploadErr } = await uploadCategoryImage(newImageFile, {
        categoryId: id
      });
      if (uploadErr) throw uploadErr;
      if (uploadRes?.publicUrl) {
        imageUrl = uploadRes.publicUrl;
      }
    }

    const updatePayload = {
      name: categoryData.name.trim(),
      slug: categoryData.slug.trim().toLowerCase(),
      description: categoryData.description?.trim() || null,
      image_url: imageUrl,
      display_order: parseInt(categoryData.display_order, 10) || 0,
      is_active: Boolean(categoryData.is_active),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('categories')
      .update(updatePayload)
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
 * Toggle category active status.
 *
 * @param {string} id - Category UUID
 * @param {boolean} isActive
 * @returns {Promise<{ data: Object | null, error: Error | null }>}
 */
export async function toggleCategoryActive(id, isActive) {
  if (!isSupabaseConfigured) {
    const store = getFallbackCategoriesStore();
    const index = store.findIndex(c => c.id === id);
    if (index !== -1) {
      store[index] = { ...store[index], is_active: isActive, updated_at: new Date().toISOString() };
      saveFallbackCategoriesStore(store);
    }
    return { data: { id, is_active: isActive }, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('categories')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error(`[categoryService] Error toggling active status for category ${id}:`, err.message);
    return { data: null, error: err };
  }
}

/**
 * Safely delete a category.
 * CRITICAL RULE: If any projects reference this category, deletion is BLOCKED
 * to protect foreign key relationships and prevent accidental project deletion.
 *
 * @param {string} id - Category UUID
 * @returns {Promise<{ success: boolean, blocked?: boolean, projectCount?: number, error: Error | null }>}
 */
export async function deleteCategorySafe(id) {
  if (!id) return { success: false, error: new Error('Category ID is required.') };

  if (!isSupabaseConfigured) {
    const store = getFallbackCategoriesStore();
    const target = store.find(c => c.id === id);
    if (!target) return { success: false, error: new Error('Category not found.') };

    const count = STATIC_PROJECTS.filter(p =>
      (p.category && p.category.toLowerCase() === target.name.toLowerCase()) ||
      (p.category && p.category.toLowerCase() === target.slug.toLowerCase())
    ).length;

    if (count > 0) {
      return {
        success: false,
        blocked: true,
        projectCount: count,
        error: new Error(
          `Cannot delete category: ${count} project${count > 1 ? 's are' : ' is'} currently assigned to this category. Please reassign or delete these projects first.`
        )
      };
    }

    const filtered = store.filter(c => c.id !== id);
    saveFallbackCategoriesStore(filtered);
    return { success: true, error: null };
  }

  try {
    // 1. Verify project assignment count
    const { count, error: countError } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id);

    if (countError) throw countError;

    if (count && count > 0) {
      return {
        success: false,
        blocked: true,
        projectCount: count,
        error: new Error(
          `Cannot delete category: ${count} project${count > 1 ? 's are' : ' is'} currently assigned to this category. Please reassign or delete these projects first.`
        )
      };
    }

    // 2. Fetch category to clean up its storage image if one exists
    const { data: catData } = await supabase
      .from('categories')
      .select('image_url')
      .eq('id', id)
      .maybeSingle();

    if (catData?.image_url) {
      const storagePath = extractStoragePathFromUrl(catData.image_url);
      if (storagePath) {
        await deleteStorageFiles([storagePath]);
      }
    }

    // 3. Delete the category record
    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    return { success: true, error: null };
  } catch (err) {
    console.error(`[categoryService] Error in deleteCategorySafe for ${id}:`, err.message);
    return { success: false, error: err };
  }
}

/**
 * Seed initial suggested room categories if they do not already exist.
 * Avoids inserting duplicate slugs.
 *
 * @returns {Promise<{ inserted: number, skipped: number, error: Error | null }>}
 */
export async function seedInitialSuggestedCategories() {
  if (!isSupabaseConfigured) {
    const store = getFallbackCategoriesStore();
    let inserted = 0;
    let skipped = 0;

    for (const item of INITIAL_SUGGESTED_CATEGORIES) {
      const exists = store.some(c => c.slug === item.slug);
      if (exists) {
        skipped++;
      } else {
        store.push({
          ...item,
          id: `cat-${item.slug}-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        inserted++;
      }
    }

    saveFallbackCategoriesStore(store);
    return { inserted, skipped, error: null };
  }

  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('categories')
      .select('slug');

    if (fetchErr) throw fetchErr;

    const existingSlugs = new Set((existing || []).map(c => c.slug.toLowerCase()));
    const toInsert = INITIAL_SUGGESTED_CATEGORIES.filter(c => !existingSlugs.has(c.slug.toLowerCase()));

    if (toInsert.length === 0) {
      return { inserted: 0, skipped: INITIAL_SUGGESTED_CATEGORIES.length, error: null };
    }

    const { error: insertErr } = await supabase
      .from('categories')
      .insert(toInsert);

    if (insertErr) throw insertErr;

    return {
      inserted: toInsert.length,
      skipped: INITIAL_SUGGESTED_CATEGORIES.length - toInsert.length,
      error: null
    };
  } catch (err) {
    console.error('[categoryService] Error seeding suggested categories:', err.message);
    return { inserted: 0, skipped: 0, error: err };
  }
}

// Backwards-compatible basic delete
export async function deleteCategory(id) {
  return deleteCategorySafe(id);
}

// Backwards-compatible admin getter
export async function getAllCategoriesAdmin() {
  return getAdminCategories();
}
