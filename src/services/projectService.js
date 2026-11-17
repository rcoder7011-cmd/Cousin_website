import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { PROJECTS as STATIC_PROJECTS } from '../data/projects.js';
import {
  resolveImageUrl,
  uploadProjectImage,
  createProjectImageRecord,
  deleteStorageFiles,
  deleteProjectStorageFolder,
  extractStoragePathFromUrl
} from './projectImageService.js';

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
 * Only returns published projects for public visitors, unless allowDraft=true.
 *
 * @param {string} slug
 * @param {Object} [options]
 * @param {boolean} [options.allowDraft=false]
 * @returns {Promise<{ data: Object | null, error: Error | null }>}
 */
export async function getProjectBySlug(slug, { allowDraft = false } = {}) {
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
      .eq('slug', cleanSlug);

    if (!allowDraft) {
      query = query.eq('is_published', true);
    }

    const { data, error } = await query.maybeSingle();

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

/**
 * Fetch projects for the admin management view with comprehensive filtering,
 * full text search, sorting, and pagination.
 *
 * @param {Object} [options]
 * @param {string} [options.search=''] - Search term in title, location, or slug
 * @param {string} [options.categoryId='all'] - Category ID filter
 * @param {string} [options.status='all'] - 'all' | 'published' | 'draft' | 'featured'
 * @param {string} [options.sortBy='latest'] - 'latest' | 'oldest' | 'alphabetical' | 'order'
 * @param {number} [options.page=1]
 * @param {number} [options.limit=10]
 * @returns {Promise<{ data: Array, count: number, totalPages: number, page: number, error: Error | null }>}
 */
export async function getAdminProjects({
  search = '',
  categoryId = 'all',
  status = 'all',
  sortBy = 'latest',
  page = 1,
  limit = 10
} = {}) {
  // Graceful fallback to static data when Supabase is not configured
  if (!isSupabaseConfigured) {
    let items = STATIC_PROJECTS.map((p, idx) => ({
      id: p.id,
      title: p.title,
      slug: p.id,
      description: p.description || p.summary || '',
      category: { id: `cat-${idx}`, name: p.category, slug: p.category.toLowerCase().replace(/\s+/g, '-') },
      location: p.location || 'Delhi NCR',
      project_date: p.completionTime || 'Delivered',
      cover_image: resolveImageUrl(p.coverImage),
      is_featured: Boolean(p.isFeatured),
      is_published: true,
      display_order: idx + 1,
      created_at: new Date(Date.now() - idx * 86400000 * 5).toISOString(),
      updated_at: new Date(Date.now() - idx * 86400000 * 2).toISOString(),
      images_count: p.photos?.length || 1
    }));

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q)
      );
    }

    if (categoryId && categoryId !== 'all') {
      items = items.filter(p => p.category.id === categoryId || p.category.slug === categoryId || p.category.name.toLowerCase() === categoryId.toLowerCase());
    }

    if (status === 'published') {
      items = items.filter(p => p.is_published);
    } else if (status === 'draft') {
      items = items.filter(p => !p.is_published);
    } else if (status === 'featured') {
      items = items.filter(p => p.is_featured);
    }

    if (sortBy === 'latest') {
      items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortBy === 'oldest') {
      items.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else if (sortBy === 'alphabetical') {
      items.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'order') {
      items.sort((a, b) => a.display_order - b.display_order);
    }

    const totalCount = items.length;
    const totalPages = Math.ceil(totalCount / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginated = items.slice(startIndex, startIndex + limit);

    return {
      data: paginated,
      count: totalCount,
      totalPages,
      page,
      error: null
    };
  }

  try {
    let query = supabase
      .from('projects')
      .select(`
        id,
        title,
        slug,
        description,
        category_id,
        location,
        project_date,
        cover_image,
        is_featured,
        is_published,
        display_order,
        created_at,
        updated_at,
        category:categories ( id, name, slug ),
        images:project_images ( id )
      `, { count: 'exact' });

    // Category filter
    if (categoryId && categoryId !== 'all') {
      query = query.eq('category_id', categoryId);
    }

    // Status filter
    if (status === 'published') {
      query = query.eq('is_published', true);
    } else if (status === 'draft') {
      query = query.eq('is_published', false);
    } else if (status === 'featured') {
      query = query.eq('is_featured', true);
    }

    // Text search in title, location, or slug
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(`title.ilike.${term},location.ilike.${term},slug.ilike.${term}`);
    }

    // Sorting
    if (sortBy === 'latest') {
      query = query.order('created_at', { ascending: false });
    } else if (sortBy === 'oldest') {
      query = query.order('created_at', { ascending: true });
    } else if (sortBy === 'alphabetical') {
      query = query.order('title', { ascending: true });
    } else if (sortBy === 'order') {
      query = query.order('display_order', { ascending: true })
                   .order('created_at', { ascending: false });
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error) throw error;

    const formatted = (data || []).map(row => ({
      ...row,
      cover_image: resolveImageUrl(row.cover_image),
      images_count: Array.isArray(row.images) ? row.images.length : 0
    }));

    const totalCount = count ?? formatted.length;
    const totalPages = Math.ceil(totalCount / limit) || 1;

    return {
      data: formatted,
      count: totalCount,
      totalPages,
      page,
      error: null
    };
  } catch (err) {
    console.error('[projectService] Error fetching admin projects:', err.message);
    return {
      data: [],
      count: 0,
      totalPages: 1,
      page: 1,
      error: err
    };
  }
}

/**
 * Fetch a single project by ID for editing in the admin panel,
 * including its full gallery images ordered by display_order.
 *
 * @param {string} id - Project UUID
 * @returns {Promise<{ data: Object | null, error: Error | null }>}
 */
export async function getAdminProjectById(id) {
  if (!id) return { data: null, error: new Error('Project ID is required.') };

  if (!isSupabaseConfigured) {
    const match = STATIC_PROJECTS.find(p => p.id === id);
    if (!match) return { data: null, error: new Error('Project not found.') };

    return {
      data: {
        id: match.id,
        title: match.title,
        slug: match.id,
        description: match.description || match.summary || '',
        category_id: null,
        category: { id: 'static-cat', name: match.category, slug: match.category.toLowerCase().replace(/\s+/g, '-') },
        location: match.location || 'Delhi NCR',
        project_date: match.completionTime || '',
        cover_image: resolveImageUrl(match.coverImage),
        is_featured: Boolean(match.isFeatured),
        is_published: true,
        display_order: 1,
        created_at: new Date().toISOString(),
        images: (match.photos || []).map((photo, idx) => ({
          id: `static-img-${idx}`,
          project_id: match.id,
          image_url: resolveImageUrl(typeof photo === 'string' ? photo : photo.src),
          alt_text: (typeof photo === 'object' ? photo.alt : null) || match.title,
          display_order: idx
        }))
      },
      error: null
    };
  }

  try {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        id,
        title,
        slug,
        description,
        category_id,
        location,
        project_date,
        cover_image,
        is_featured,
        is_published,
        display_order,
        created_at,
        updated_at,
        category:categories ( id, name, slug ),
        images:project_images ( id, project_id, image_url, alt_text, display_order, created_at )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return { data: null, error: new Error('Project not found.') };
    }

    // Sort images by display_order
    const sortedImages = (data.images || []).sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

    return {
      data: {
        ...data,
        images: sortedImages
      },
      error: null
    };
  } catch (err) {
    console.error(`[projectService] Error fetching admin project ${id}:`, err.message);
    return { data: null, error: err };
  }
}

/**
 * Check if a project slug is available (not already in use by another project).
 *
 * @param {string} slug
 * @param {string} [excludeId] - Optional current project ID to exclude when editing
 * @returns {Promise<{ isAvailable: boolean, error: Error | null }>}
 */
export async function checkSlugAvailability(slug, excludeId = null) {
  if (!slug || !slug.trim()) {
    return { isAvailable: false, error: new Error('Slug cannot be empty.') };
  }

  const cleanSlug = slug.trim().toLowerCase();

  if (!isSupabaseConfigured) {
    const isTaken = STATIC_PROJECTS.some(p => p.id === cleanSlug && p.id !== excludeId);
    return { isAvailable: !isTaken, error: null };
  }

  try {
    let query = supabase
      .from('projects')
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
    console.error(`[projectService] Error checking slug "${cleanSlug}":`, err.message);
    return { isAvailable: false, error: err };
  }
}

/**
 * Toggle publishing status of a project.
 *
 * @param {string} id - Project UUID
 * @param {boolean} isPublished - New status
 * @returns {Promise<{ data: Object | null, error: Error | null }>}
 */
export async function toggleProjectPublish(id, isPublished) {
  if (!isSupabaseConfigured) {
    return { data: { id, is_published: isPublished }, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('projects')
      .update({
        is_published: isPublished,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error(`[projectService] Error toggling publish status for ${id}:`, err.message);
    return { data: null, error: err };
  }
}

/**
 * Toggle featured highlight status of a project.
 *
 * @param {string} id - Project UUID
 * @param {boolean} isFeatured - New status
 * @returns {Promise<{ data: Object | null, error: Error | null }>}
 */
export async function toggleProjectFeatured(id, isFeatured) {
  if (!isSupabaseConfigured) {
    return { data: { id, is_featured: isFeatured }, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('projects')
      .update({
        is_featured: isFeatured,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error(`[projectService] Error toggling featured status for ${id}:`, err.message);
    return { data: null, error: err };
  }
}

/**
 * Create a new project complete with metadata and gallery images.
 * Uploads images to the 'project-images' bucket and saves image records in project_images.
 *
 * @param {Object} projectData - Basic project fields
 * @param {Array<{ file: File, altText: string, displayOrder: number, isCover: boolean }>} imageItems
 * @param {Function} [onProgress] - Optional upload progress callback (current, total)
 * @returns {Promise<{ data: Object | null, error: Error | null }>}
 */
export async function createProjectFull(projectData, imageItems = [], onProgress = null) {
  if (!isSupabaseConfigured) {
    return {
      data: { id: `proj-${Date.now()}`, ...projectData },
      error: null
    };
  }

  try {
    // 1. Insert the project row first
    const insertPayload = {
      title: projectData.title.trim(),
      slug: projectData.slug.trim().toLowerCase(),
      description: projectData.description?.trim() || null,
      category_id: projectData.category_id || null,
      location: projectData.location?.trim() || 'Delhi NCR',
      project_date: projectData.project_date || null,
      cover_image: null, // will be updated below once images are uploaded
      is_featured: Boolean(projectData.is_featured),
      is_published: Boolean(projectData.is_published),
      display_order: parseInt(projectData.display_order, 10) || 0
    };

    const { data: createdProject, error: projectError } = await supabase
      .from('projects')
      .insert([insertPayload])
      .select()
      .single();

    if (projectError) throw projectError;

    const projectId = createdProject.id;
    let coverImageUrl = null;

    // 2. Upload images to Supabase Storage and create project_images rows
    if (Array.isArray(imageItems) && imageItems.length > 0) {
      for (let i = 0; i < imageItems.length; i++) {
        const item = imageItems[i];
        if (onProgress) onProgress(i + 1, imageItems.length);

        if (item.file) {
          const { data: uploadRes, error: uploadErr } = await uploadProjectImage(item.file, {
            projectId
          });

          if (uploadErr) {
            console.warn(`[projectService] Error uploading image #${i + 1}:`, uploadErr.message);
            continue;
          }

          if (uploadRes?.publicUrl) {
            // Save in project_images
            await createProjectImageRecord({
              projectId,
              imageUrl: uploadRes.publicUrl,
              altText: item.altText || createdProject.title,
              displayOrder: item.displayOrder ?? i
            });

            // If marked as cover or first image, set as cover
            if (item.isCover || !coverImageUrl) {
              coverImageUrl = uploadRes.publicUrl;
            }
          }
        } else if (item.imageUrl) {
          // Image selected directly from Media Library (already uploaded)
          await createProjectImageRecord({
            projectId,
            imageUrl: item.imageUrl,
            altText: item.altText || createdProject.title,
            displayOrder: item.displayOrder ?? i
          });

          if (item.isCover || !coverImageUrl) {
            coverImageUrl = item.imageUrl;
          }
        }
      }

      // 3. Update cover_image on the project row
      if (coverImageUrl) {
        await supabase
          .from('projects')
          .update({ cover_image: coverImageUrl })
          .eq('id', projectId);
      }
    }

    // 4. Return freshly created project
    const finalResult = await getAdminProjectById(projectId);
    return { data: finalResult.data || createdProject, error: null };

  } catch (err) {
    console.error('[projectService] Error in createProjectFull:', err.message);
    return { data: null, error: err };
  }
}

/**
 * Update an existing project, synchronize images, handle deletions and new uploads.
 *
 * @param {string} id - Project UUID
 * @param {Object} projectData - Updated project fields
 * @param {Object} imageOptions
 * @param {Array} [imageOptions.existingImages=[]] - Current images with updated altText/displayOrder
 * @param {Array} [imageOptions.newImagesToUpload=[]] - New files to upload
 * @param {Array<string>} [imageOptions.imageIdsToDelete=[]] - IDs to remove
 * @param {string} [imageOptions.coverImageUrl] - Explicit cover image URL
 * @param {Function} [onProgress] - Optional upload progress callback
 * @returns {Promise<{ data: Object | null, error: Error | null }>}
 */
export async function updateProjectFull(
  id,
  projectData,
  {
    existingImages = [],
    newImagesToUpload = [],
    imageIdsToDelete = [],
    coverImageUrl = null
  } = {},
  onProgress = null
) {
  if (!id) return { data: null, error: new Error('Project ID is required.') };

  if (!isSupabaseConfigured) {
    return { data: { id, ...projectData }, error: null };
  }

  try {
    // 1. Delete removed images from DB and Storage
    if (Array.isArray(imageIdsToDelete) && imageIdsToDelete.length > 0) {
      // Find URLs of images to delete so we can remove from storage
      const { data: toDeleteRows } = await supabase
        .from('project_images')
        .select('id, image_url')
        .in('id', imageIdsToDelete);

      if (toDeleteRows && toDeleteRows.length > 0) {
        const storagePaths = toDeleteRows
          .map(r => extractStoragePathFromUrl(r.image_url))
          .filter(Boolean);

        if (storagePaths.length > 0) {
          await deleteStorageFiles(storagePaths);
        }

        await supabase
          .from('project_images')
          .delete()
          .in('id', imageIdsToDelete);
      }
    }

    // 2. Update existing images metadata (alt_text, display_order)
    if (Array.isArray(existingImages) && existingImages.length > 0) {
      for (const img of existingImages) {
        if (img.id && !imageIdsToDelete.includes(img.id)) {
          await supabase
            .from('project_images')
            .update({
              alt_text: img.alt_text || projectData.title,
              display_order: img.display_order ?? 0
            })
            .eq('id', img.id);
        }
      }
    }

    // 3. Upload new images
    let resolvedCover = coverImageUrl;
    if (Array.isArray(newImagesToUpload) && newImagesToUpload.length > 0) {
      for (let i = 0; i < newImagesToUpload.length; i++) {
        const item = newImagesToUpload[i];
        if (onProgress) onProgress(i + 1, newImagesToUpload.length);

        if (item.file) {
          const { data: uploadRes, error: uploadErr } = await uploadProjectImage(item.file, {
            projectId: id
          });

          if (uploadErr) {
            console.warn(`[projectService] Error uploading new image #${i + 1}:`, uploadErr.message);
            continue;
          }

          if (uploadRes?.publicUrl) {
            await createProjectImageRecord({
              projectId: id,
              imageUrl: uploadRes.publicUrl,
              altText: item.altText || projectData.title,
              displayOrder: item.displayOrder ?? (existingImages.length + i)
            });

            if (item.isCover || !resolvedCover) {
              resolvedCover = uploadRes.publicUrl;
            }
          }
        } else if (item.imageUrl) {
          // Pre-existing image selected from Media Library
          await createProjectImageRecord({
            projectId: id,
            imageUrl: item.imageUrl,
            altText: item.altText || projectData.title,
            displayOrder: item.displayOrder ?? (existingImages.length + i)
          });

          if (item.isCover || !resolvedCover) {
            resolvedCover = item.imageUrl;
          }
        }
      }
    }

    // 4. Update the main project record
    const updatePayload = {
      title: projectData.title.trim(),
      slug: projectData.slug.trim().toLowerCase(),
      description: projectData.description?.trim() || null,
      category_id: projectData.category_id || null,
      location: projectData.location?.trim() || 'Delhi NCR',
      project_date: projectData.project_date || null,
      is_featured: Boolean(projectData.is_featured),
      is_published: Boolean(projectData.is_published),
      display_order: parseInt(projectData.display_order, 10) || 0,
      updated_at: new Date().toISOString()
    };

    if (resolvedCover) {
      updatePayload.cover_image = resolvedCover;
    }

    const { data: updatedProject, error: updateError } = await supabase
      .from('projects')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // 5. Return updated project
    const finalResult = await getAdminProjectById(id);
    return { data: finalResult.data || updatedProject, error: null };

  } catch (err) {
    console.error(`[projectService] Error in updateProjectFull for ${id}:`, err.message);
    return { data: null, error: err };
  }
}

/**
 * Permanently delete a project, its gallery image records, and its storage folder.
 *
 * @param {string} id - Project UUID
 * @returns {Promise<{ success: boolean, error: Error | null }>}
 */
export async function deleteProjectFull(id) {
  if (!id) return { success: false, error: new Error('Project ID is required.') };

  if (!isSupabaseConfigured) {
    return { success: true, error: null };
  }

  try {
    // 1. Delete all storage assets for this project
    await deleteProjectStorageFolder(id);

    // 2. Delete project row from database (cascade deletes project_images)
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

// Keep backwards-compatible basic operations
export async function createProject(projectData) {
  return createProjectFull(projectData, []);
}

export async function updateProject(id, updates) {
  return updateProjectFull(id, updates, {});
}

export async function deleteProject(id) {
  return deleteProjectFull(id);
}
