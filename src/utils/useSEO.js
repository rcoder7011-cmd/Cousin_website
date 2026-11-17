import { useEffect } from 'react';
import { useSettings } from '../context/useSettings.js';

/**
 * Custom hook to dynamically manage document head meta tags based on site settings and current page context.
 *
 * @param {Object} [pageOverrides]
 * @param {string} [pageOverrides.title]
 * @param {string} [pageOverrides.description]
 * @param {string} [pageOverrides.image]
 * @param {string} [pageOverrides.canonical]
 * @param {string} [pageOverrides.pageKey] - 'home' | 'about' | 'services' | 'projects' | 'contact'
 */
export function useSEO(pageOverrides = {}) {
  const { seo, companyName } = useSettings();

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const pageKey = pageOverrides.pageKey;
    const pageConfig = pageKey && seo?.page_seo?.[pageKey] ? seo.page_seo[pageKey] : null;

    // 1. Title Resolution
    const resolvedTitle =
      pageOverrides.title ||
      pageConfig?.title ||
      seo?.meta_title ||
      `${companyName} | Interior Design & Interior Work • 10+ Years Experience`;

    document.title = resolvedTitle;

    // 2. Helper to set or create meta tag
    const setMeta = (selector, attrName, attrVal, content) => {
      if (!content) return;
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrVal);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // 3. Helper to set or create link tag
    const setLink = (rel, href) => {
      if (!href) return;
      let el = document.querySelector(`link[rel='${rel}']`);
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    };

    // 4. Meta Description
    const resolvedDesc =
      pageOverrides.description ||
      pageConfig?.description ||
      seo?.meta_description ||
      `${companyName} has over 10 years of experience in interior design and interior work across Gurugram, Delhi, and Noida. Direct site supervision with dedicated master craftsmen.`;

    setMeta("meta[name='description']", 'name', 'description', resolvedDesc);
    setMeta("meta[property='og:description']", 'property', 'og:description', resolvedDesc);

    // 5. Meta Keywords
    if (seo?.meta_keywords) {
      setMeta("meta[name='keywords']", 'name', 'keywords', seo.meta_keywords);
    }

    // 6. OpenGraph Title & Site Name
    setMeta("meta[property='og:title']", 'property', 'og:title', resolvedTitle);
    setMeta("meta[property='og:site_name']", 'property', 'og:site_name', companyName);

    // 7. OpenGraph Image & Twitter Image
    const resolvedImage = pageOverrides.image || seo?.og_image || seo?.twitter_image;
    if (resolvedImage) {
      const fullImageUrl = resolvedImage.startsWith('http')
        ? resolvedImage
        : `${window.location.origin}${resolvedImage}`;

      setMeta("meta[property='og:image']", 'property', 'og:image', fullImageUrl);
      setMeta("meta[name='twitter:image']", 'name', 'twitter:image', fullImageUrl);
    }

    // 8. Canonical URL
    const canonicalBase = seo?.canonical_url || 'https://saifiinteriorhub.in';
    const canonicalHref = pageOverrides.canonical || `${canonicalBase}${window.location.pathname}`;
    setLink('canonical', canonicalHref);

    // 9. Robots Indexing
    if (seo?.robots_index) {
      setMeta("meta[name='robots']", 'name', 'robots', seo.robots_index);
    }
  }, [seo, companyName, pageOverrides.title, pageOverrides.description, pageOverrides.image, pageOverrides.canonical, pageOverrides.pageKey]);
}
