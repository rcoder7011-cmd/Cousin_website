import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { PROJECTS as STATIC_PROJECTS } from '../data/projects';
import { resolveImageUrl } from './projectImageService';

/**
 * Normalizes a raw project (whether from Supabase relational query or static fallback)
 * into a consistent, predictable shape for the frontend UI.
 *
 * @param {Object} raw
 * @returns {Object|null}
 */
export function normalizeProject(raw) {
  if (!raw) return null;

  const categoryName = typeof raw.category === 'object' && raw.category !== null
    ? raw.category.name
    : (typeof raw.category === 'string' ? raw.category : 'Interior Work');

  const categorySlug = typeof raw.category === 'object' && raw.category !== null
    ? raw.category.slug
    : (typeof raw.category === 'string' ? raw.category.toLowerCase().replace(/\s+/g, '-') : 'all');

  // Normalize gallery images
  let images = [];
  if (Array.isArray(raw.images) && raw.images.length > 0) {
    images = raw.images.map((img, idx) => {
      if (typeof img === 'string') {
        return {
          id: `img-${idx}`,
          url: resolveImageUrl(img),
          alt: raw.title || 'Interior project photo - Saifi Interior Hub',
          displayOrder: idx
        };
      }
      return {
        id: img.id || `img-${idx}`,
        url: resolveImageUrl(img.image_url),
        alt: img.alt_text || raw.title || 'Interior project photo - Saifi Interior Hub',
        displayOrder: img.display_order ?? idx
      };
    });
  } else if (raw.cover_image || raw.coverImage) {
    images = [{
      id: 'cover-0',
      url: resolveImageUrl(raw.cover_image || raw.coverImage),
      alt: raw.title || 'Interior project cover - Saifi Interior Hub',
      displayOrder: 0
    }];
  }

  const coverUrl = resolveImageUrl(raw.cover_image || raw.coverImage);

  return {
    id: raw.id,
    title: raw.title,
    slug: raw.slug || (raw.id && String(raw.id).includes('-') ? String(raw.id) : String(raw.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')),
    description: raw.description || raw.summary || '',
    category: categoryName,
    categorySlug: categorySlug,
    location: raw.location || 'Delhi NCR',
    projectDate: raw.project_date || raw.completionTime || null,
    coverImage: coverUrl,
    isFeatured: Boolean(raw.is_featured ?? raw.isFeatured),
    isPublished: Boolean(raw.is_published ?? true),
    displayOrder: raw.display_order ?? 0,
    scope: raw.scope || '',
    completionTime: raw.completionTime || (raw.project_date ? new Date(raw.project_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Turnkey Delivery'),
    summary: raw.summary || raw.description || '',
    highlights: Array.isArray(raw.highlights) ? raw.highlights : [],
    images
  };
}

/**
 * Fetch published projects with dynamic filtering, sorting, and pagination.
 *
 * @param {Object} options
 * @param {string} [options.categorySlug] - Category slug filter ('all' or specific slug)
 * @param {string} [options.searchQuery] - Text search in title and description
 * @param {string} [options.sortBy='order'] - 'latest' | 'oldest' | 'order'
 * @param {boolean} [options.featuredOnly=false] - Only return featured projects
 * @param {number} [options.limit] - Max items to return
 * @param {number} [options.offset=0] - Pagination offset
 * @returns {Promise<{ data: Array, count: number, error: Error | null }>}
 */
export async function getPublishedProjects({
  categorySlug,
  searchQuery,
  sortBy = 'order',
  featuredOnly = false,
  limit,
  offset = 0
} = {}) {
  // Graceful fallback when Supabase is not configured
  if (!isSupabaseConfigured) {
    let results = STATIC_PROJECTS.map(normalizeProject);

    if (categorySlug && categorySlug !== 'all' && categorySlug !== 'All Projects') {
      results = results.filter(p =>
        p.categorySlug.toLowerCase() === categorySlug.toLowerCase() ||
        p.category.toLowerCase() === categorySlug.toLowerCase()
      );
    }

    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      results = results.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q)
      );
    }

    if (featuredOnly) {
      results = results.filter(p => p.isFeatured);
    }

    // Sort static results
    if (sortBy === 'latest') {
      results.sort((a, b) => (b.projectDate || '').localeCompare(a.projectDate || ''));
    } else if (sortBy === 'oldest') {
      results.sort((a, b) => (a.projectDate || '').localeCompare(b.projectDate || ''));
    }

    const totalCount = results.length;
    if (limit) {
      results = results.slice(offset, offset + limit);
    }

    return { data: results, count: totalCount, error: null };
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
        category:categories!inner ( id, name, slug ),
        images:project_images ( id, image_url, alt_text, display_order )
      `, { count: 'exact' })
      .eq('is_published', true);

    // Filter by category slug if provided
    if (categorySlug && categorySlug !== 'all' && categorySlug !== 'All Projects') {
      query = query.eq('categories.slug', categorySlug.toLowerCase());
    }

    // Filter featured
    if (featuredOnly) {
      query = query.eq('is_featured', true);
    }

    // Search query in title or description
    if (searchQuery && searchQuery.trim()) {
      const term = `%${searchQuery.trim()}%`;
      query = query.or(`title.ilike.${term},description.ilike.${term},location.ilike.${term}`);
    }

    // Dynamic sorting
    if (sortBy === 'latest') {
      query = query.order('project_date', { ascending: false, nullsFirst: false })
                   .order('created_at', { ascending: false });
    } else if (sortBy === 'oldest') {
      query = query.order('project_date', { ascending: true, nullsFirst: false })
                   .order('created_at', { ascending: true });
    } else {
      query = query.order('display_order', { ascending: true })
                   .order('created_at', { ascending: false });
    }

    // Pagination
    if (limit) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data, count, error } = await query;
    if (error) throw error;

    // If Supabase table is newly created and still empty, provide graceful fallback
    if (!data || data.length === 0) {
      let fallback = STATIC_PROJECTS.map(normalizeProject);
      if (categorySlug && categorySlug !== 'all' && categorySlug !== 'All Projects') {
        fallback = fallback.filter(p =>
          p.categorySlug.toLowerCase() === categorySlug.toLowerCase() ||
          p.category.toLowerCase() === categorySlug.toLowerCase()
        );
      }
      if (featuredOnly) {
        fallback = fallback.filter(p => p.isFeatured);
      }
      return { data: fallback, count: fallback.length, error: null };
    }

    const normalized = data.map(normalizeProject);
    return { data: normalized, count: count || normalized.length, error: null };

  } catch (err) {
    console.error('[projectService] Error fetching published projects:', err.message);
    // Graceful fallback to static data on network/query error
    return { data: STATIC_PROJECTS.map(normalizeProject), count: STATIC_PROJECTS.length, error: err };
  }
}

/**
 * Fetch a single project by its unique slug, including its category and gallery images.
 * Only returns published projects for public visitors.
 *
 * @param {string} slug
 * @returns {Promise<{ data: Object | null, error: Error | null }>}
 */
export async function getProjectBySlug(slug) {
  if (!slug) return { data: null, error: new Error('Slug parameter is required.') };

  const cleanSlug = String(slug).toLowerCase().trim();

  if (!isSupabaseConfigured) {
    const match = STATIC_PROJECTS.find(p =>
      p.id.toLowerCase() === cleanSlug ||
      p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') === cleanSlug
    );
    return { data: match ? normalizeProject(match) : null, error: null };
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
      .eq('slug', cleanSlug)
      .eq('is_published', true)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      // Check static fallback as well in case database is partially populated
      const fallbackMatch = STATIC_PROJECTS.find(p =>
        p.id.toLowerCase() === cleanSlug ||
        p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') === cleanSlug
      );
      if (fallbackMatch) {
        return { data: normalizeProject(fallbackMatch), error: null };
      }
      return { data: null, error: null };
    }

    return { data: normalizeProject(data), error: null };
  } catch (err) {
    console.error(`[projectService] Error fetching project by slug "${cleanSlug}":`, err.message);
    const fallbackMatch = STATIC_PROJECTS.find(p =>
      p.id.toLowerCase() === cleanSlug ||
      p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') === cleanSlug
    );
    return { data: fallbackMatch ? normalizeProject(fallbackMatch) : null, error: err };
  }
}

/**
 * Fetch featured projects for homepage display (returns up to limit published items)
 * @param {number} [limit=4]
 * @returns {Promise<{ data: Array, error: Error | null }>}
 */
export async function getFeaturedProjects(limit = 4) {
  const result = await getPublishedProjects({ featuredOnly: true, limit });
  return { data: result.data || [], error: result.error };
}

// ============================================================================
// ADMIN PROJECT OPERATIONS (Protected by Database RLS & is_admin())
// ============================================================================

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
