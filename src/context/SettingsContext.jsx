import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SettingsContext } from './useSettings.js';
import { getAllSettings, DEFAULT_SETTINGS } from '../services/settingsService.js';
import { COMPANY_INFO } from '../data/designer.js';

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    getAllSettings()
      .then(({ data }) => {
        if (isMounted) {
          if (data && typeof data === 'object') {
            setSettings(data);
          }
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.warn('[SettingsProvider] Failed to load settings:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [reloadCount]);

  const reloadSettings = useCallback(() => {
    setReloadCount(c => c + 1);
  }, []);

  // Update Favicon dynamically if customized
  useEffect(() => {
    const faviconUrl = settings.general_settings?.favicon_url;
    if (faviconUrl) {
      let link = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = faviconUrl;
    }
  }, [settings.general_settings?.favicon_url]);

  // Convenience getters
  const companyName = useMemo(() => {
    return (
      settings.business_info?.business_name ||
      settings.general_settings?.website_name ||
      COMPANY_INFO.name
    );
  }, [settings]);

  const tagline = useMemo(() => {
    return (
      settings.general_settings?.tagline ||
      COMPANY_INFO.tagline
    );
  }, [settings]);

  const phone = useMemo(() => {
    return (
      settings.contact_info?.primary_phone ||
      settings.business_info?.business_phone ||
      COMPANY_INFO.contact.phone
    );
  }, [settings]);

  const whatsappNumber = useMemo(() => {
    return (
      settings.contact_info?.whatsapp_number ||
      settings.business_info?.whatsapp_number ||
      COMPANY_INFO.contact.whatsappNumber
    );
  }, [settings]);

  const email = useMemo(() => {
    return (
      settings.contact_info?.email ||
      settings.business_info?.business_email ||
      COMPANY_INFO.contact.email
    );
  }, [settings]);

  const yearsExperience = useMemo(() => {
    return (
      settings.business_info?.years_of_experience ||
      '10+'
    );
  }, [settings]);

  const address = useMemo(() => {
    return (
      settings.contact_info?.address ||
      settings.business_info?.address ||
      COMPANY_INFO.contact.location
    );
  }, [settings]);

  const logoUrl = useMemo(() => {
    return settings.general_settings?.logo_url || '/Website_Logo.png';
  }, [settings]);

  const socialLinks = useMemo(() => {
    return settings.social_media || DEFAULT_SETTINGS.social_media;
  }, [settings]);

  /**
   * Helper to generate dynamic WhatsApp links with custom or default message
   */
  const getWhatsAppLink = useCallback((customMessage = null) => {
    const num = (whatsappNumber || '918449802502').replace(/[^0-9]/g, '');
    const defaultMsg = `Hi ${companyName}, I would like to enquire about your interior design and interior work services.`;
    const message = encodeURIComponent(customMessage || defaultMsg);
    return `https://wa.me/${num}?text=${message}`;
  }, [companyName, whatsappNumber]);

  const value = useMemo(() => ({
    settings,
    isLoading,
    reloadSettings,
    companyName,
    tagline,
    phone,
    whatsappNumber,
    email,
    yearsExperience,
    address,
    logoUrl,
    socialLinks,
    getWhatsAppLink,
    general: settings.general_settings || DEFAULT_SETTINGS.general_settings,
    business: settings.business_info || DEFAULT_SETTINGS.business_info,
    contact: settings.contact_info || DEFAULT_SETTINGS.contact_info,
    social: settings.social_media || DEFAULT_SETTINGS.social_media,
    homepage: settings.homepage_content || DEFAULT_SETTINGS.homepage_content,
    seo: settings.seo_settings || DEFAULT_SETTINGS.seo_settings,
    footer: settings.footer_settings || DEFAULT_SETTINGS.footer_settings,
    advanced: settings.advanced_settings || DEFAULT_SETTINGS.advanced_settings
  }), [
    settings,
    isLoading,
    reloadSettings,
    companyName,
    tagline,
    phone,
    whatsappNumber,
    email,
    yearsExperience,
    address,
    logoUrl,
    socialLinks,
    getWhatsAppLink
  ]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}
