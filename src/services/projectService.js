import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { PROJECTS as STATIC_PROJECTS } from '../data/projects';

/**
 * Fetch published projects with optional filters (category, featured, limit).
 * Falls back to existing static projects if Supabase is unconfigured or returns an empty set during setup.
 *
 * @param {Object} options
 * @param {string} [options.categorySlug] - Optional category slug filter
 * @param {boolean} [options.featuredOnly] - Only return featured projects (e.g. for homepage)
 * @param {number} [options.limit] - Max number of projects to return
 * @returns {Promise<{ data: Array, error: Error | null }>}
 */
export async function getPublishedProjects({ categorySlug, featuredOnly, limit } = {}) {
  if (!isSupabaseConfigured) {
    let results = [...STATIC_PROJECTS];
    if (categorySlug && categorySlug !== 'all') {
      results = results.filter(p => p.category.toLowerCase() === categorySlug.toLowerCase());
    }
    if (featuredOnly) {
      results = results.slice(0, limit || 4);
    } else if (limit) {
      results = results.slice(0, limit);
    }
    return { data: results, error: null };
  }

  try {
    let query = supabase
      .from('projects')
      .select(`
        id,
        title,
        slug,
        description,
        location,
        project_date,
        cover_image,
        is_featured,
        is_published,
        display_order,
        created_at,
        category:categories ( id, name, slug ),
        images:project_images ( id, image_url, alt_text, display_order )
      `)
      .eq('is_published', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (featuredOnly) {
      query = query.eq('is_featured', true);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) throw error;

    // If Supabase table is newly created and still empty, provide graceful fallback
    if (!data || data.length === 0) {
      return { data: STATIC_PROJECTS, error: null };
    }

    // Filter by category slug in-memory if requested (or via subquery)
    let filtered = data;
    if (categorySlug && categorySlug !== 'all') {
      filtered = filtered.filter(p => p.category?.slug === categorySlug);
    }

    return { data: filtered, error: null };
  } catch (err) {
    console.error('[projectService] Error fetching published projects:', err.message);
    return { data: STATIC_PROJECTS, error: err };
  }
}

/**
 * Fetch a single project by its unique slug, including its category and gallery images
 * @param {string} slug
 * @returns {Promise<{ data: Object | null, error: Error | null }>}
 */
export async function getProjectBySlug(slug) {
  if (!isSupabaseConfigured) {
    const match = STATIC_PROJECTS.find(p => p.id === slug || p.title.toLowerCase().replace(/\s+/g, '-') === slug);
    return { data: match || null, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        id,
        title,
        slug,
        description,
        location,
        project_date,
        cover_image,
        is_featured,
        is_published,
        display_order,
        created_at,
        category:categories ( id, name, slug ),
        images:project_images ( id, image_url, alt_text, display_order )
      `)
      .eq('slug', slug)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error(`[projectService] Error fetching project by slug "${slug}":`, err.message);
    return { data: null, error: err };
  }
}

/**
 * Fetch featured projects for homepage display
 * @param {number} [limit=4]
 * @returns {Promise<{ data: Array, error: Error | null }>}
 */
export async function getFeaturedProjects(limit = 4) {
  return getPublishedProjects({ featuredOnly: true, limit });
}

// ============================================================================
// ADMIN PROJECT OPERATIONS (Protected by Database RLS & is_admin())
// ============================================================================

/**
 * Fetch all projects (published & drafts) for admin dashboard
 * @param {Object} [options]
 * @returns {Promise<{ data: Array, error: Error | null }>}
 */
export async function getAllProjectsAdmin({ categoryId } = {}) {
  if (!isSupabaseConfigured) {
    return { data: [], error: new Error('Supabase is not configured.') };
  }

  try {
    let query = supabase
      .from('projects')
      .select(`
        *,
        category:categories ( id, name, slug ),
        images:project_images ( count )
      `)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return { data: data || [], error: null };
  } catch (err) {
    console.error('[projectService] Admin error fetching projects:', err.message);
    return { data: [], error: err };
  }
}

/**
 * Create a new project record (Admin only)
 * @param {Object} projectData
 * @returns {Promise<{ data: Object | null, error: Error | null }>}
 */
export async function createProject(projectData) {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase is not configured.') };
  }

  try {
    const { data, error } = await supabase
      .from('projects')
      .insert([projectData])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error('[projectService] Error creating project:', err.message);
    return { data: null, error: err };
  }
}

/**
 * Update an existing project record (Admin only)
 * @param {string} id - Project UUID
 * @param {Object} updates
 * @returns {Promise<{ data: Object | null, error: Error | null }>}
 */
export async function updateProject(id, updates) {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase is not configured.') };
  }

  try {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error(`[projectService] Error updating project ${id}:`, err.message);
    return { data: null, error: err };
  }
}

/**
 * Delete a project record (Admin only). Cascade deletion handles project_images automatically.
 * @param {string} id - Project UUID
 * @returns {Promise<{ success: boolean, error: Error | null }>}
 */
export async function deleteProject(id) {
  if (!isSupabaseConfigured) {
    return { success: false, error: new Error('Supabase is not configured.') };
  }

  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true, error: null };
  } catch (err) {
    console.error(`[projectService] Error deleting project ${id}:`, err.message);
    return { success: false, error: err };
  }
}
