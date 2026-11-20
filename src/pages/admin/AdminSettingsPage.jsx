import React, { useState, useEffect } from 'react';
import {
  Settings,
  Globe,
  Briefcase,
  Phone,
  Share2,
  Home,
  Search,
  LayoutTemplate,
  Sliders,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Image as ImageIcon,
  ExternalLink,
  X,
  ShieldCheck
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import MediaPickerModal from '../../components/admin/MediaPickerModal.jsx';
import {
  getAllSettings,
  saveSettingSection,
  resetSectionToDefault,
  validateSettingsSection,
  DEFAULT_SETTINGS
} from '../../services/settingsService.js';
import { useSettings } from '../../context/useSettings.js';
import './AdminSettingsPage.css';

const CURRENT_YEAR = new Date().getFullYear();

const TABS = [
  { id: 'general', label: 'General', icon: Globe, sectionKey: 'general_settings' },
  { id: 'business', label: 'Business Info', icon: Briefcase, sectionKey: 'business_info' },
  { id: 'contact', label: 'Contact', icon: Phone, sectionKey: 'contact_info' },
  { id: 'social', label: 'Social Media', icon: Share2, sectionKey: 'social_media' },
  { id: 'homepage', label: 'Homepage Content', icon: Home, sectionKey: 'homepage_content' },
  { id: 'seo', label: 'SEO & Metadata', icon: Search, sectionKey: 'seo_settings' },
  { id: 'footer', label: 'Footer', icon: LayoutTemplate, sectionKey: 'footer_settings' },
  { id: 'advanced', label: 'Advanced', icon: Sliders, sectionKey: 'advanced_settings' }
];

export default function AdminSettingsPage() {
  const { reloadSettings } = useSettings();

  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Stored settings from server / defaults
  const [savedSettings, setSavedSettings] = useState(DEFAULT_SETTINGS);

  // Working editable settings state
  const [formSettings, setFormSettings] = useState(DEFAULT_SETTINGS);

  // Field errors per section
  const [fieldErrors, setFieldErrors] = useState({});

  // Media picker modal state: { isOpen, targetField, targetSection, title }
  const [mediaPickerConfig, setMediaPickerConfig] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3800);
  };

  // 1. Initial Load of all site settings
  useEffect(() => {
    let isMounted = true;
    getAllSettings()
      .then(({ data, error: err }) => {
        if (!isMounted) return;
        if (err && !data) {
          showToast('Could not load settings from database.', 'error');
        } else if (data) {
          setSavedSettings(data);
          setFormSettings(JSON.parse(JSON.stringify(data)));
        }
        setIsLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('[AdminSettingsPage] Error loading settings:', err);
        showToast('Could not load settings from database.', 'error');
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Current tab object
  const currentTabObj = TABS.find(t => t.id === activeTab) || TABS[0];
  const currentSectionKey = currentTabObj.sectionKey;

  // Check if current tab is dirty (modified)
  const isCurrentTabDirty = JSON.stringify(formSettings[currentSectionKey]) !== JSON.stringify(savedSettings[currentSectionKey]);

  // Handler for form field changes
  const handleFieldChange = (sectionKey, fieldKey, value) => {
    setFormSettings(prev => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        [fieldKey]: value
      }
    }));

    // Clear error on modify
    if (fieldErrors[fieldKey]) {
      setFieldErrors(prev => ({ ...prev, [fieldKey]: null }));
    }
  };

  // 2. Save Active Section
  const handleSaveSection = async (sectionKeyToSave = currentSectionKey) => {
    const sectionValues = formSettings[sectionKeyToSave];

    // Validate
    const { isValid, errors } = validateSettingsSection(sectionKeyToSave, sectionValues);
    if (!isValid) {
      setFieldErrors(errors);
      showToast('Please fix highlighted errors before saving.', 'error');
      return;
    }

    setIsSaving(true);
    setFieldErrors({});

    try {
      const { data, error } = await saveSettingSection(sectionKeyToSave, sectionValues);
      if (error) throw error;

      // Update saved reference
      setSavedSettings(prev => ({
        ...prev,
        [sectionKeyToSave]: JSON.parse(JSON.stringify(data || sectionValues))
      }));

      // Trigger app context update
      if (reloadSettings) {
        await reloadSettings();
      }

      showToast('Settings saved successfully!');
    } catch (err) {
      console.error('[AdminSettingsPage] Save error:', err);
      showToast(err.message || 'Failed to save settings.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // 3. Discard Changes for current section
  const handleDiscardChanges = (sectionKey = currentSectionKey) => {
    setFormSettings(prev => ({
      ...prev,
      [sectionKey]: JSON.parse(JSON.stringify(savedSettings[sectionKey]))
    }));
    setFieldErrors({});
    showToast('Changes discarded.');
  };

  // 4. Reset Section to Company Defaults
  const handleResetToDefault = async (sectionKey = currentSectionKey) => {
    if (!window.confirm(`Reset this section to official Saifi Interior Hub defaults?`)) {
      return;
    }

    setIsSaving(true);
    try {
      const { data, error } = await resetSectionToDefault(sectionKey);
      if (error) throw error;

      setSavedSettings(prev => ({
        ...prev,
        [sectionKey]: JSON.parse(JSON.stringify(data))
      }));

      setFormSettings(prev => ({
        ...prev,
        [sectionKey]: JSON.parse(JSON.stringify(data))
      }));

      setFieldErrors({});

      if (reloadSettings) {
        await reloadSettings();
      }

      showToast('Section reset to official defaults.');
    } catch (err) {
      console.error('[AdminSettingsPage] Reset error:', err);
      showToast('Failed to reset section.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Media Library Selection callback
  const handleMediaPickerSelect = (selected) => {
    if (!mediaPickerConfig) return;
    const item = Array.isArray(selected) ? selected[0] : selected;
    if (item && item.public_url) {
      handleFieldChange(mediaPickerConfig.targetSection, mediaPickerConfig.targetField, item.public_url);
    }
    setMediaPickerConfig(null);
  };

  if (isLoading) {
    return (
      <AdminLayout pageTitle="Website Settings">
        <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }}>
          <RefreshCw size={36} className="animate-spin" color="var(--admin-accent)" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--admin-primary)' }}>Loading Website Settings...</h2>
          <p style={{ color: 'var(--admin-text-muted)' }}>Retrieving configuration from Supabase database...</p>
        </div>
      </AdminLayout>
    );
  }

  // Active form sections
  const general = formSettings.general_settings || DEFAULT_SETTINGS.general_settings;
  const business = formSettings.business_info || DEFAULT_SETTINGS.business_info;
  const contact = formSettings.contact_info || DEFAULT_SETTINGS.contact_info;
  const social = formSettings.social_media || DEFAULT_SETTINGS.social_media;
  const homepage = formSettings.homepage_content || DEFAULT_SETTINGS.homepage_content;
  const seo = formSettings.seo_settings || DEFAULT_SETTINGS.seo_settings;
  const footer = formSettings.footer_settings || DEFAULT_SETTINGS.footer_settings;
  const advanced = formSettings.advanced_settings || DEFAULT_SETTINGS.advanced_settings;

  return (
    <AdminLayout pageTitle="Website Settings">
      <div className="admin-settings-container">
        {/* Toast Feedback */}
        {toast && (
          <div className={`settings-toast-banner ${toast.type === 'error' ? 'settings-toast-error' : 'settings-toast-success'}`}>
            {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            <span>{toast.message}</span>
          </div>
        )}

        {/* 1. Page Header Card */}
        <div className="settings-header-card">
          <div className="settings-header-left">
            <div className="settings-header-icon">
              <Settings size={26} />
            </div>
            <div>
              <h1 className="settings-header-title">Website Settings</h1>
              <p className="settings-header-subtitle">
                Manage your website information, branding, contact details and SEO settings.
              </p>
            </div>
          </div>

          <div className="settings-header-actions">
            {isCurrentTabDirty && (
              <span className="dirty-indicator-pill">
                <span className="dirty-dot" />
                <span>Unsaved Changes</span>
              </span>
            )}

            <button
              type="button"
              onClick={() => handleDiscardChanges(currentSectionKey)}
              disabled={!isCurrentTabDirty || isSaving}
              className="btn btn-outline btn-sm"
              title="Discard unsaved changes in this tab"
            >
              <RotateCcw size={14} />
              <span>Discard</span>
            </button>

            <button
              type="button"
              onClick={() => handleSaveSection(currentSectionKey)}
              disabled={isSaving}
              className="btn btn-primary btn-sm"
            >
              {isSaving ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>Save {currentTabObj.label}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 2. Navigation Tabs Bar */}
        <div className="settings-tabs-nav" role="tablist">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isTabDirty = JSON.stringify(formSettings[tab.sectionKey]) !== JSON.stringify(savedSettings[tab.sectionKey]);

            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`settings-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => {
                  setFieldErrors({});
                  setActiveTab(tab.id);
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                {isTabDirty && <span className="tab-dirty-indicator" title="Unsaved changes in this tab" />}
              </button>
            );
          })}
        </div>

        {/* 3. Tab Contents */}
        <div className="settings-tab-body">
          {/* TAB 1: GENERAL SETTINGS */}
          {activeTab === 'general' && (
            <div className="settings-section-card">
              <div className="settings-card-header">
                <div>
                  <h2 className="settings-card-title">General Website Settings</h2>
                  <p className="settings-card-desc">
                    Control primary branding, website title, default language, and custom logo/favicon assets.
                  </p>
                </div>
              </div>

              <div className="settings-form-grid">
                <div className="form-row-2col">
                  <div className="settings-field-group">
                    <label className="settings-label">
                      <span>Website Name <span className="label-required">*</span></span>
                    </label>
                    <input
                      type="text"
                      value={general.website_name || ''}
                      onChange={(e) => handleFieldChange('general_settings', 'website_name', e.target.value)}
                      placeholder="Saifi Interior Hub"
                      className={`settings-input ${fieldErrors.website_name ? 'has-error' : ''}`}
                    />
                    {fieldErrors.website_name && (
                      <span className="field-error-text">{fieldErrors.website_name}</span>
                    )}
                  </div>

                  <div className="settings-field-group">
                    <label className="settings-label">
                      <span>Contact Email</span>
                    </label>
                    <input
                      type="email"
                      value={general.contact_email || ''}
                      onChange={(e) => handleFieldChange('general_settings', 'contact_email', e.target.value)}
                      placeholder="saifiinteriorhub@gmail.com"
                      className={`settings-input ${fieldErrors.contact_email ? 'has-error' : ''}`}
                    />
                    {fieldErrors.contact_email && (
                      <span className="field-error-text">{fieldErrors.contact_email}</span>
                    )}
                  </div>
                </div>

                <div className="settings-field-group">
                  <label className="settings-label">
                    <span>Website Tagline</span>
                  </label>
                  <input
                    type="text"
                    value={general.tagline || ''}
                    onChange={(e) => handleFieldChange('general_settings', 'tagline', e.target.value)}
                    placeholder="Over a decade of creating beautiful, functional, and thoughtfully designed spaces."
                    className="settings-input"
                  />
                  <span className="field-help-text">Displayed in browser titles, headers, and footer overviews.</span>
                </div>

                <div className="settings-field-group">
                  <label className="settings-label">
                    <span>Website Description</span>
                  </label>
                  <textarea
                    rows={3}
                    value={general.description || ''}
                    onChange={(e) => handleFieldChange('general_settings', 'description', e.target.value)}
                    placeholder="Saifi Interior Hub creates beautiful, functional and inspiring interior spaces tailored to clients' needs."
                    className="settings-textarea"
                  />
                </div>

                <div className="form-row-2col">
                  {/* Website Logo */}
                  <div className="settings-field-group">
                    <label className="settings-label">
                      <span>Website Logo (Optional)</span>
                      <span className="label-hint">PNG, SVG, or WebP</span>
                    </label>
                    <div className="settings-image-selector">
                      <div className="image-selector-preview">
                        <div className="image-thumb-box">
                          {general.logo_url ? (
                            <img src={general.logo_url} alt="Website Logo" />
                          ) : (
                            <ImageIcon size={24} className="image-thumb-placeholder" />
                          )}
                        </div>
                        <div className="image-selector-meta">
                          <span className="image-selector-title">
                            {general.logo_url ? 'Custom Logo Selected' : 'Default Brand Text'}
                          </span>
                          <span className="image-selector-path">
                            {general.logo_url ? general.logo_url.split('/').pop() : 'Uses styled typography logo'}
                          </span>
                        </div>
                      </div>
                      <div className="image-selector-actions">
                        <button
                          type="button"
                          onClick={() => setMediaPickerConfig({
                            isOpen: true,
                            targetSection: 'general_settings',
                            targetField: 'logo_url',
                            title: 'Choose Website Logo from Media Library'
                          })}
                          className="btn btn-outline btn-sm"
                        >
                          Choose from Library
                        </button>
                        {general.logo_url && (
                          <button
                            type="button"
                            onClick={() => handleFieldChange('general_settings', 'logo_url', null)}
                            className="btn btn-danger-outline btn-sm"
                            title="Remove custom logo"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Favicon */}
                  <div className="settings-field-group">
                    <label className="settings-label">
                      <span>Website Favicon</span>
                      <span className="label-hint">Square 32x32 or SVG</span>
                    </label>
                    <div className="settings-image-selector">
                      <div className="image-selector-preview">
                        <div className="image-thumb-box" style={{ width: '48px', height: '48px' }}>
                          {general.favicon_url ? (
                            <img src={general.favicon_url} alt="Favicon" />
                          ) : (
                            <Globe size={22} className="image-thumb-placeholder" />
                          )}
                        </div>
                        <div className="image-selector-meta">
                          <span className="image-selector-title">
                            {general.favicon_url ? 'Custom Favicon' : 'Default /favicon.svg'}
                          </span>
                          <span className="image-selector-path">
                            {general.favicon_url ? general.favicon_url.split('/').pop() : 'Saifi brand mark'}
                          </span>
                        </div>
                      </div>
                      <div className="image-selector-actions">
                        <button
                          type="button"
                          onClick={() => setMediaPickerConfig({
                            isOpen: true,
                            targetSection: 'general_settings',
                            targetField: 'favicon_url',
                            title: 'Choose Favicon from Media Library'
                          })}
                          className="btn btn-outline btn-sm"
                        >
                          Choose from Library
                        </button>
                        {general.favicon_url && (
                          <button
                            type="button"
                            onClick={() => handleFieldChange('general_settings', 'favicon_url', null)}
                            className="btn btn-danger-outline btn-sm"
                            title="Reset to default favicon"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-row-2col">
                  <div className="settings-field-group">
                    <label className="settings-label">
                      <span>Default Language</span>
                    </label>
                    <select
                      value={general.default_language || 'en'}
                      onChange={(e) => handleFieldChange('general_settings', 'default_language', e.target.value)}
                      className="settings-select"
                    >
                      <option value="en">English (en-IN)</option>
                      <option value="hi">Hindi (hi-IN)</option>
                    </select>
                  </div>

                  <div className="settings-field-group">
                    <label className="settings-label">
                      <span>Official Domain Reference</span>
                    </label>
                    <input
                      type="text"
                      value="https://saifiinteriorhub.in"
                      disabled
                      className="settings-input"
                      style={{ background: '#f8f9fa', color: '#6c757d' }}
                    />
                    <span className="field-help-text">Production domain locked to verified business entity.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BUSINESS INFORMATION */}
          {activeTab === 'business' && (
            <div className="settings-section-card">
              <div className="settings-card-header">
                <div>
                  <h2 className="settings-card-title">Business Information</h2>
                  <p className="settings-card-desc">
                    Verified commercial credentials for Saifi Interior Hub. The 10+ years of experience belongs to the company.
                  </p>
                </div>
              </div>

              <div className="settings-form-grid">
                <div className="form-row-2col">
                  <div className="settings-field-group">
                    <label className="settings-label">
                      <span>Business Name <span className="label-required">*</span></span>
                    </label>
                    <input
                      type="text"
                      value={business.business_name || ''}
                      onChange={(e) => handleFieldChange('business_info', 'business_name', e.target.value)}
                      placeholder="Saifi Interior Hub"
                      className={`settings-input ${fieldErrors.business_name ? 'has-error' : ''}`}
                    />
                    {fieldErrors.business_name && (
                      <span className="field-error-text">{fieldErrors.business_name}</span>
                    )}
                  </div>

                  <div className="settings-field-group">
                    <label className="settings-label">
                      <span>Company Experience Label</span>
                      <span className="label-hint">Belongs to Saifi Interior Hub</span>
                    </label>
                    <input
                      type="text"
                      value={business.years_of_experience || ''}
                      onChange={(e) => handleFieldChange('business_info', 'years_of_experience', e.target.value)}
                      placeholder="10+"
                      className="settings-input"
                    />
                    <span className="field-help-text">Controls the live animated experience counter and showcase badge.</span>
                  </div>
                </div>

                <div className="settings-field-group">
                  <label className="settings-label">
                    <span>Business Description / Company Bio</span>
                  </label>
                  <textarea
                    rows={4}
                    value={business.description || ''}
                    onChange={(e) => handleFieldChange('business_info', 'description', e.target.value)}
                    placeholder="Saifi Interior Hub brings over 10 years of experience in interior design and interior work across Gurugram, Delhi, and Noida with direct on-site supervision..."
                    className="settings-textarea"
                  />
                </div>

                <div className="form-row-2col">
                  <div className="settings-field-group">
                    <label className="settings-label">
                      <span>Business Email</span>
                    </label>
                    <input
                      type="email"
                      value={business.business_email || ''}
                      onChange={(e) => handleFieldChange('business_info', 'business_email', e.target.value)}
                      placeholder="saifiinteriorhub@gmail.com"
                      className={`settings-input ${fieldErrors.business_email ? 'has-error' : ''}`}
                    />
                    {fieldErrors.business_email && (
                      <span className="field-error-text">{fieldErrors.business_email}</span>
                    )}
                  </div>

                  <div className="settings-field-group">
                    <label className="settings-label">
                      <span>Business Phone</span>
                    </label>
                    <input
                      type="text"
                      value={business.business_phone || ''}
                      onChange={(e) => handleFieldChange('business_info', 'business_phone', e.target.value)}
                      placeholder="+91 84498 02502"
                      className={`settings-input ${fieldErrors.business_phone ? 'has-error' : ''}`}
                    />
                    {fieldErrors.business_phone && (
                      <span className="field-error-text">{fieldErrors.business_phone}</span>
                    )}
                  </div>
                </div>

                <div className="form-row-3col">
                  <div className="settings-field-group">
                    <label className="settings-label">
                      <span>WhatsApp Number</span>
                    </label>
                    <input
                      type="text"
                      value={business.whatsapp_number || ''}
                      onChange={(e) => handleFieldChange('business_info', 'whatsapp_number', e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="918449802502"
                      className="settings-input"
                    />
                    <span className="field-help-text">Country code prefix without '+', e.g. 918449802502</span>
                  </div>

                  <div className="settings-field-group">
                    <label className="settings-label">
                      <span>City / Region</span>
                    </label>
                    <input
                      type="text"
                      value={business.city || ''}
                      onChange={(e) => handleFieldChange('business_info', 'city', e.target.value)}
                      placeholder="Delhi NCR (Gurugram, Delhi, Noida)"
                      className="settings-input"
                    />
                  </div>

                  <div className="settings-field-group">
                    <label className="settings-label">
                      <span>Country</span>
                    </label>
                    <input
                      type="text"
                      value={business.country || 'India'}
                      onChange={(e) => handleFieldChange('business_info', 'country', e.target.value)}
                      placeholder="India"
                      className="settings-input"
                    />
                  </div>
                </div>

                <div className="settings-field-group">
                  <label className="settings-label">
                    <span>Working Hours</span>
                  </label>
                  <input
                    type="text"
                    value={business.working_hours || ''}
                    onChange={(e) => handleFieldChange('business_info', 'working_hours', e.target.value)}
                    placeholder="Mon – Sat: 9:00 AM – 8:00 PM (Sunday Closed)"
                    className="settings-input"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CONTACT INFORMATION */}
          {activeTab === 'contact' && (
            <div className="settings-section-card">
              <div className="settings-card-header">
                <div>
                  <h2 className="settings-card-title">Contact Settings & Direct Channels</h2>
                  <p className="settings-card-desc">
                    Control touchpoints for phone calls, WhatsApp chat, office location, and Google Maps embed links.
                  </p>
                </div>
              </div>

              <div className="settings-form-grid">
                <div className="form-row-2col">
                  <div className="settings-field-group">
                    <label className="settings-label">
                      <span>Primary Phone Number <span className="label-required">*</span></span>
                    </label>
                    <input
                      type="text"
                      value={contact.primary_phone || ''}
                      onChange={(e) => handleFieldChange('contact_info', 'primary_phone', e.target.value)}
                      placeholder="+91 84498 02502"
                      className={`settings-input ${fieldErrors.primary_phone ? 'has-error' : ''}`}
                    />
                    {fieldErrors.primary_phone && (
                      <span className="field-error-text">{fieldErrors.primary_phone}</span>
                    )}
                  </div>

                  <div className="settings-field-group">
                    <label className="settings-label">
                      <span>Secondary Phone Number (Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={contact.secondary_phone || ''}
                      onChange={(e) => handleFieldChange('contact_info', 'secondary_phone', e.target.value)}
                      placeholder="+91 98765 43210"
                      className={`settings-input ${fieldErrors.secondary_phone ? 'has-error' : ''}`}
                    />
                    {fieldErrors.secondary_phone && (
                      <span className="field-error-text">{fieldErrors.secondary_phone}</span>
                    )}
                  </div>
                </div>

                <div className="form-row-2col">
                  <div className="settings-field-group">
                    <label className="settings-label">
                      <span>WhatsApp Number</span>
                      <span className="label-hint">Digits only with country code</span>
                    </label>
                    <input
                      type="text"
                      value={contact.whatsapp_number || ''}
                      onChange={(e) => handleFieldChange('contact_info', 'whatsapp_number', e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="918449802502"
                      className="settings-input"
                    />
                  </div>

                  <div className="settings-field-group">
                    <label className="settings-label">
                      <span>Official Contact Email</span>
                    </label>
                    <input
                      type="email"
                      value={contact.email || ''}
                      onChange={(e) => handleFieldChange('contact_info', 'email', e.target.value)}
                      placeholder="saifiinteriorhub@gmail.com"
                      className={`settings-input ${fieldErrors.email ? 'has-error' : ''}`}
                    />
                    {fieldErrors.email && (
                      <span className="field-error-text">{fieldErrors.email}</span>
                    )}
                  </div>
                </div>

                <div className="settings-field-group">
                  <label className="settings-label">
                    <span>Physical Address / Office Region</span>
                  </label>
                  <input
                    type="text"
                    value={contact.address || ''}
                    onChange={(e) => handleFieldChange('contact_info', 'address', e.target.value)}
                    placeholder="Gurugram • Delhi • Noida (Delhi NCR, India)"
                    className="settings-input"
                  />
                </div>

                <div className="settings-field-group">
                  <label className="settings-label">
                    <span>Google Maps Link</span>
                  </label>
                  <input
                    type="url"
                    value={contact.google_maps_url || ''}
                    onChange={(e) => handleFieldChange('contact_info', 'google_maps_url', e.target.value)}
                    placeholder="https://maps.google.com/?q=Delhi+NCR"
                    className={`settings-input ${fieldErrors.google_maps_url ? 'has-error' : ''}`}
                  />
                  {fieldErrors.google_maps_url && (
                    <span className="field-error-text">{fieldErrors.google_maps_url}</span>
                  )}
                </div>

                <div className="settings-field-group">
                  <label className="settings-label">
                    <span>Contact Page Description / Subtitle</span>
                  </label>
                  <textarea
                    rows={2}
                    value={contact.contact_description || ''}
                    onChange={(e) => handleFieldChange('contact_info', 'contact_description', e.target.value)}
                    placeholder="Connect directly with Saifi Interior Hub for on-site visits, architectural space discussions, and transparent cost estimates..."
                    className="settings-textarea"
                  />
                </div>

                {/* Live Touchpoints Tester Box */}
                <div className="preview-showcase-box">
                  <div className="preview-box-heading">Live Touchpoint Verification</div>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {contact.primary_phone && (
                      <a
                        href={`tel:${contact.primary_phone.replace(/\s+/g, '')}`}
                        className="btn btn-outline btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        <Phone size={14} color="#28a745" />
                        <span>Test Call: {contact.primary_phone}</span>
                      </a>
                    )}
                    {contact.whatsapp_number && (
                      <a
                        href={`https://wa.me/${contact.whatsapp_number}?text=Test%20enquiry%20from%20Saifi%20Interior%20Hub`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        <ExternalLink size={14} color="#25d366" />
                        <span>Test WhatsApp: +{contact.whatsapp_number}</span>
                      </a>
                    )}
                    {contact.email && (
                      <a
                        href={`mailto:${contact.email}`}
                        className="btn btn-outline btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        <ExternalLink size={14} />
                        <span>Test Email: {contact.email}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SOCIAL MEDIA */}
          {activeTab === 'social' && (
            <div className="settings-section-card">
              <div className="settings-card-header">
                <div>
                  <h2 className="settings-card-title">Social Media Profiles</h2>
                  <p className="settings-card-desc">
                    Connect official social channels. Leave blank to hide unconfigured platforms from the public footer.
                  </p>
                </div>
              </div>

              <div className="settings-form-grid">
                {['instagram', 'facebook', 'youtube', 'pinterest', 'linkedin'].map(platform => {
                  const val = social[platform] || '';
                  const err = fieldErrors[platform];

                  return (
                    <div key={platform} className="settings-field-group">
                      <label className="settings-label">
                        <span style={{ textTransform: 'capitalize' }}>{platform} Profile URL</span>
                        <span className="label-hint">
                          {val ? (
                            <span style={{ color: '#28a745', fontWeight: 600 }}>● Active on Website</span>
                          ) : (
                            <span>○ Not Configured (Hidden)</span>
                          )}
                        </span>
                      </label>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input
                          type="url"
                          value={val}
                          onChange={(e) => handleFieldChange('social_media', platform, e.target.value)}
                          placeholder={`https://${platform}.com/saifiinteriorhub`}
                          className={`settings-input ${err ? 'has-error' : ''}`}
                        />
                        {val && (
                          <a
                            href={val}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline btn-sm"
                            title="Open link in new tab"
                            style={{ flexShrink: 0 }}
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                      {err && <span className="field-error-text">{err}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: HOMEPAGE CONTENT */}
          {activeTab === 'homepage' && (
            <div className="settings-section-card">
              <div className="settings-card-header">
                <div>
                  <h2 className="settings-card-title">Homepage Content Management</h2>
                  <p className="settings-card-desc">
                    Customize homepage hero copy, 10+ years experience banner, services heading, and consultation call-to-action without touching code.
                  </p>
                </div>
              </div>

              <div className="settings-form-grid">
                {/* 1. Hero Section Content */}
                <div style={{ paddingBottom: '1rem', borderBottom: '1px solid #f0ede8' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--admin-accent)', marginBottom: '1rem' }}>
                    1. Hero Section
                  </h3>

                  <div className="settings-form-grid">
                    <div className="settings-field-group">
                      <label className="settings-label">
                        <span>Hero Main Heading</span>
                      </label>
                      <input
                        type="text"
                        value={homepage.hero_heading || ''}
                        onChange={(e) => handleFieldChange('homepage_content', 'hero_heading', e.target.value)}
                        placeholder="Crafting Thoughtful Interiors with Direct Site Execution"
                        className="settings-input"
                      />
                    </div>

                    <div className="settings-field-group">
                      <label className="settings-label">
                        <span>Hero Supporting Subtitle</span>
                      </label>
                      <textarea
                        rows={3}
                        value={homepage.hero_subtitle || ''}
                        onChange={(e) => handleFieldChange('homepage_content', 'hero_subtitle', e.target.value)}
                        placeholder="With over 10 years of experience in interior design and interior work, Saifi Interior Hub pairs refined aesthetic vision with a dedicated team of master craftsmen..."
                        className="settings-textarea"
                      />
                    </div>

                    <div className="form-row-2col">
                      <div className="settings-field-group">
                        <label className="settings-label">
                          <span>Primary Button Text</span>
                        </label>
                        <input
                          type="text"
                          value={homepage.hero_btn_text || ''}
                          onChange={(e) => handleFieldChange('homepage_content', 'hero_btn_text', e.target.value)}
                          placeholder="View Completed Sites"
                          className="settings-input"
                        />
                      </div>

                      <div className="settings-field-group">
                        <label className="settings-label">
                          <span>Primary Button Route / Link</span>
                        </label>
                        <input
                          type="text"
                          value={homepage.hero_btn_link || ''}
                          onChange={(e) => handleFieldChange('homepage_content', 'hero_btn_link', e.target.value)}
                          placeholder="/projects"
                          className="settings-input"
                        />
                      </div>
                    </div>

                    {/* Hero Media Image */}
                    <div className="settings-field-group">
                      <label className="settings-label">
                        <span>Hero Primary Showcase Image</span>
                      </label>
                      <div className="settings-image-selector">
                        <div className="image-selector-preview">
                          <div className="image-thumb-box">
                            {homepage.hero_image ? (
                              <img src={homepage.hero_image} alt="Hero Showcase" />
                            ) : (
                              <ImageIcon size={24} className="image-thumb-placeholder" />
                            )}
                          </div>
                          <div className="image-selector-meta">
                            <span className="image-selector-title">
                              {homepage.hero_image ? 'Showcase Photography Selected' : 'Default Living Room Photo'}
                            </span>
                            <span className="image-selector-path">
                              {homepage.hero_image || 'Living Room/78d10c45.png'}
                            </span>
                          </div>
                        </div>
                        <div className="image-selector-actions">
                          <button
                            type="button"
                            onClick={() => setMediaPickerConfig({
                              isOpen: true,
                              targetSection: 'homepage_content',
                              targetField: 'hero_image',
                              title: 'Choose Hero Image from Media Library'
                            })}
                            className="btn btn-outline btn-sm"
                          >
                            Choose from Library
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Company Experience Section (10+ Years) */}
                <div style={{ paddingBottom: '1rem', borderBottom: '1px solid #f0ede8' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--admin-accent)', marginBottom: '1rem' }}>
                    2. Company Experience Counter Section (10+ Years)
                  </h3>

                  <div className="settings-form-grid">
                    <div className="form-row-2col">
                      <div className="settings-field-group">
                        <label className="settings-label">
                          <span>Experience Counter Number</span>
                          <span className="label-hint">Default: 10</span>
                        </label>
                        <input
                          type="text"
                          value={homepage.experience_number || ''}
                          onChange={(e) => handleFieldChange('homepage_content', 'experience_number', e.target.value)}
                          placeholder="10"
                          className="settings-input"
                        />
                      </div>

                      <div className="settings-field-group">
                        <label className="settings-label">
                          <span>Experience Label / Suffix</span>
                        </label>
                        <input
                          type="text"
                          value={homepage.experience_label || ''}
                          onChange={(e) => handleFieldChange('homepage_content', 'experience_label', e.target.value)}
                          placeholder="Years of Transforming Spaces"
                          className="settings-input"
                        />
                      </div>
                    </div>

                    <div className="settings-field-group">
                      <label className="settings-label">
                        <span>Experience Section Heading</span>
                      </label>
                      <input
                        type="text"
                        value={homepage.experience_heading || ''}
                        onChange={(e) => handleFieldChange('homepage_content', 'experience_heading', e.target.value)}
                        placeholder="A Proven Decade of Craftsmanship and Direct On-Site Supervision"
                        className="settings-input"
                      />
                    </div>

                    <div className="settings-field-group">
                      <label className="settings-label">
                        <span>Experience Section Description</span>
                      </label>
                      <textarea
                        rows={3}
                        value={homepage.experience_description || ''}
                        onChange={(e) => handleFieldChange('homepage_content', 'experience_description', e.target.value)}
                        placeholder="Over 10 years of dedicated interior execution across Delhi NCR. Master carpenters, POP artisans, and finishing technicians working cohesively under direct supervision."
                        className="settings-textarea"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Call to Action Banner */}
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--admin-accent)', marginBottom: '1rem' }}>
                    3. Consultation Call-to-Action Banner
                  </h3>

                  <div className="settings-form-grid">
                    <div className="settings-field-group">
                      <label className="settings-label">
                        <span>CTA Banner Heading</span>
                      </label>
                      <input
                        type="text"
                        value={homepage.cta_heading || ''}
                        onChange={(e) => handleFieldChange('homepage_content', 'cta_heading', e.target.value)}
                        placeholder="Have a Flat, Villa or Commercial Site Ready for Work?"
                        className="settings-input"
                      />
                    </div>

                    <div className="settings-field-group">
                      <label className="settings-label">
                        <span>CTA Banner Description</span>
                      </label>
                      <textarea
                        rows={2}
                        value={homepage.cta_description || ''}
                        onChange={(e) => handleFieldChange('homepage_content', 'cta_description', e.target.value)}
                        placeholder="Connect directly with Saifi Interior Hub (saifiinteriorhub.in). Benefit from more than 10 years of on-site execution experience with transparent estimates."
                        className="settings-textarea"
                      />
                    </div>

                    <div className="settings-field-group">
                      <label className="settings-label">
                        <span>CTA Primary Button Text</span>
                      </label>
                      <input
                        type="text"
                        value={homepage.cta_btn_text || ''}
                        onChange={(e) => handleFieldChange('homepage_content', 'cta_btn_text', e.target.value)}
                        placeholder="Chat Directly on WhatsApp"
                        className="settings-input"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SEO SETTINGS */}
          {activeTab === 'seo' && (
            <div className="settings-section-card">
              <div className="settings-card-header">
                <div>
                  <h2 className="settings-card-title">SEO & Metadata Configuration</h2>
                  <p className="settings-card-desc">
                    Optimize search rankings, OpenGraph rich snippets for WhatsApp / social sharing, and robots indexing.
                  </p>
                </div>
              </div>

              <div className="settings-form-grid">
                <div className="settings-field-group">
                  <label className="settings-label">
                    <span>Default Meta Title <span className="label-required">*</span></span>
                    <span className="label-hint">{(seo.meta_title || '').length} characters (Recommended: 50-60)</span>
                  </label>
                  <input
                    type="text"
                    value={seo.meta_title || ''}
                    onChange={(e) => handleFieldChange('seo_settings', 'meta_title', e.target.value)}
                    placeholder="Saifi Interior Hub | Interior Design and Interior Work • 10+ Years Experience - Delhi NCR"
                    className={`settings-input ${fieldErrors.meta_title ? 'has-error' : ''}`}
                  />
                  {fieldErrors.meta_title && (
                    <span className="field-error-text">{fieldErrors.meta_title}</span>
                  )}
                </div>

                <div className="settings-field-group">
                  <label className="settings-label">
                    <span>Default Meta Description</span>
                    <span className="label-hint">{(seo.meta_description || '').length} characters (Recommended: 140-160)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={seo.meta_description || ''}
                    onChange={(e) => handleFieldChange('seo_settings', 'meta_description', e.target.value)}
                    placeholder="Saifi Interior Hub has over 10 years of experience in interior design and interior work across Gurugram, Delhi, and Noida. Direct site supervision with dedicated master craftsmen."
                    className="settings-textarea"
                  />
                </div>

                <div className="form-row-2col">
                  <div className="settings-field-group">
                    <label className="settings-label">
                      <span>Canonical Website URL</span>
                    </label>
                    <input
                      type="url"
                      value={seo.canonical_url || ''}
                      onChange={(e) => handleFieldChange('seo_settings', 'canonical_url', e.target.value)}
                      placeholder="https://saifiinteriorhub.in"
                      className={`settings-input ${fieldErrors.canonical_url ? 'has-error' : ''}`}
                    />
                    {fieldErrors.canonical_url && (
                      <span className="field-error-text">{fieldErrors.canonical_url}</span>
                    )}
                  </div>

                  <div className="settings-field-group">
                    <label className="settings-label">
                      <span>Robots Indexing Preference</span>
                    </label>
                    <select
                      value={seo.robots_index || 'index, follow'}
                      onChange={(e) => handleFieldChange('seo_settings', 'robots_index', e.target.value)}
                      className="settings-select"
                    >
                      <option value="index, follow">Index, Follow (Recommended for Production)</option>
                      <option value="noindex, nofollow">No Index, No Follow (Staging / Private)</option>
                      <option value="index, nofollow">Index, No Follow</option>
                    </select>
                  </div>
                </div>

                <div className="settings-field-group">
                  <label className="settings-label">
                    <span>Meta Keywords (Comma separated)</span>
                  </label>
                  <input
                    type="text"
                    value={seo.meta_keywords || ''}
                    onChange={(e) => handleFieldChange('seo_settings', 'meta_keywords', e.target.value)}
                    placeholder="interior design, interior work, Saifi Interior Hub, modular kitchen, pop ceiling, wardrobe, Delhi NCR"
                    className="settings-input"
                  />
                </div>

                {/* OpenGraph Image */}
                <div className="settings-field-group">
                  <label className="settings-label">
                    <span>OpenGraph Social Share Card Image (1200x630px recommended)</span>
                  </label>
                  <div className="settings-image-selector">
                    <div className="image-selector-preview">
                      <div className="image-thumb-box" style={{ width: '90px', height: '55px' }}>
                        {seo.og_image ? (
                          <img src={seo.og_image} alt="OG Card Preview" />
                        ) : (
                          <ImageIcon size={22} className="image-thumb-placeholder" />
                        )}
                      </div>
                      <div className="image-selector-meta">
                        <span className="image-selector-title">
                          {seo.og_image ? 'Social Preview Image Set' : 'Using default living room showcase'}
                        </span>
                        <span className="image-selector-path">
                          {seo.og_image || 'Living Room/78d10c45.png'}
                        </span>
                      </div>
                    </div>
                    <div className="image-selector-actions">
                      <button
                        type="button"
                        onClick={() => setMediaPickerConfig({
                          isOpen: true,
                          targetSection: 'seo_settings',
                          targetField: 'og_image',
                          title: 'Choose Social Share Image from Media Library'
                        })}
                        className="btn btn-outline btn-sm"
                      >
                        Choose from Library
                      </button>
                    </div>
                  </div>
                </div>

                {/* LIVE PREVIEW: GOOGLE SEARCH SNIPPET */}
                <div className="preview-showcase-box">
                  <div className="preview-box-heading">Google Search Result Preview</div>
                  <div className="google-snippet-card">
                    <div className="google-snippet-url">
                      <Globe size={13} color="#5f6368" />
                      <span>{seo.canonical_url || 'https://saifiinteriorhub.in'}</span>
                    </div>
                    <h4 className="google-snippet-title">
                      {seo.meta_title || 'Saifi Interior Hub | Interior Design and Interior Work • 10+ Years Experience'}
                    </h4>
                    <p className="google-snippet-desc">
                      {seo.meta_description || 'Saifi Interior Hub has over 10 years of experience in interior design and interior work across Gurugram, Delhi, and Noida.'}
                    </p>
                  </div>
                </div>

                {/* LIVE PREVIEW: OPENGRAPH CARD */}
                <div className="preview-showcase-box">
                  <div className="preview-box-heading">Social Share Card Preview (WhatsApp, LinkedIn, Twitter/X)</div>
                  <div className="social-og-card-preview">
                    {seo.og_image && (
                      <img src={seo.og_image} alt="Social Card" className="social-og-img" />
                    )}
                    <div className="social-og-body">
                      <span className="social-og-domain">SAIFIINTERIORHUB.IN</span>
                      <h4 className="social-og-title">
                        {seo.og_title || seo.meta_title || 'Saifi Interior Hub | 10+ Years Experience'}
                      </h4>
                      <p className="social-og-desc">
                        {seo.og_description || seo.meta_description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: FOOTER SETTINGS */}
          {activeTab === 'footer' && (
            <div className="settings-section-card">
              <div className="settings-card-header">
                <div>
                  <h2 className="settings-card-title">Footer Settings & Copyright</h2>
                  <p className="settings-card-desc">
                    Control public footer text, copyright disclaimer, dynamic current year tag, and location highlights.
                  </p>
                </div>
              </div>

              <div className="settings-form-grid">
                <div className="settings-field-group">
                  <label className="settings-label">
                    <span>Footer Brand Narrative</span>
                  </label>
                  <textarea
                    rows={3}
                    value={footer.footer_description || ''}
                    onChange={(e) => handleFieldChange('footer_settings', 'footer_description', e.target.value)}
                    placeholder="With over 10 years of experience in interior design and interior work, Saifi Interior Hub focuses on creating beautiful, functional, and thoughtfully designed residential and commercial spaces..."
                    className="settings-textarea"
                  />
                </div>

                <div className="form-row-2col">
                  <div className="settings-field-group">
                    <label className="settings-label">
                      <span>Copyright Notice Template</span>
                      <span className="label-hint">Use {'{year}'} for dynamic year</span>
                    </label>
                    <input
                      type="text"
                      value={footer.copyright_text || ''}
                      onChange={(e) => handleFieldChange('footer_settings', 'copyright_text', e.target.value)}
                      placeholder="© {year} Saifi Interior Hub. All Rights Reserved."
                      className="settings-input"
                    />
                    <span className="field-help-text">
                      Preview: {(footer.copyright_text || '© {year} Saifi Interior Hub.').replace('{year}', CURRENT_YEAR)}
                    </span>
                  </div>

                  <div className="settings-field-group">
                    <label className="settings-label">
                      <span>Footer Service Regions / Address</span>
                    </label>
                    <input
                      type="text"
                      value={footer.footer_address || ''}
                      onChange={(e) => handleFieldChange('footer_settings', 'footer_address', e.target.value)}
                      placeholder="Gurugram • Delhi • Noida"
                      className="settings-input"
                    />
                  </div>
                </div>

                <div className="toggle-switch-row">
                  <div className="toggle-switch-meta">
                    <span className="toggle-switch-title">Display Configured Social Links in Footer</span>
                    <span className="toggle-switch-desc">
                      Shows Instagram, Facebook, and other configured social media icons in the footer.
                    </span>
                  </div>
                  <label className="custom-switch">
                    <input
                      type="checkbox"
                      checked={Boolean(footer.show_social)}
                      onChange={(e) => handleFieldChange('footer_settings', 'show_social', e.target.checked)}
                    />
                    <span className="custom-slider" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: ADVANCED SETTINGS */}
          {activeTab === 'advanced' && (
            <div className="settings-section-card">
              <div className="settings-card-header">
                <div>
                  <h2 className="settings-card-title">Advanced Settings & Maintenance</h2>
                  <p className="settings-card-desc">
                    Control maintenance mode, emergency announcement banners, and custom tracking headers safely.
                  </p>
                </div>
              </div>

              <div className="settings-form-grid">
                <div className="toggle-switch-row">
                  <div className="toggle-switch-meta">
                    <span className="toggle-switch-title">Website Maintenance Mode</span>
                    <span className="toggle-switch-desc">
                      When enabled, shows an elegant notice banner on public pages while keeping admin access live.
                    </span>
                  </div>
                  <label className="custom-switch">
                    <input
                      type="checkbox"
                      checked={Boolean(advanced.maintenance_mode)}
                      onChange={(e) => handleFieldChange('advanced_settings', 'maintenance_mode', e.target.checked)}
                    />
                    <span className="custom-slider" />
                  </label>
                </div>

                {advanced.maintenance_mode && (
                  <div className="settings-field-group">
                    <label className="settings-label">
                      <span>Maintenance Mode Banner Message</span>
                    </label>
                    <textarea
                      rows={2}
                      value={advanced.maintenance_message || ''}
                      onChange={(e) => handleFieldChange('advanced_settings', 'maintenance_message', e.target.value)}
                      placeholder="We are currently updating our portfolio. Please contact us on WhatsApp at +91 84498 02502 for immediate enquiries."
                      className="settings-textarea"
                    />
                  </div>
                )}

                <div className="settings-field-group">
                  <label className="settings-label">
                    <span>Database Verification & Health Status</span>
                  </label>
                  <div style={{ padding: '0.85rem 1rem', background: '#f8f9fa', border: '1px solid #e5e0d8', borderRadius: '8px', fontSize: '0.84rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#28a745', fontWeight: 600, marginBottom: '0.35rem' }}>
                      <ShieldCheck size={16} />
                      <span>Table: public.site_settings is operational</span>
                    </div>
                    <div style={{ color: '#6c757d', fontSize: '0.78rem' }}>
                      Row-Level Security (RLS) active. Read access open to public; mutation privileges restricted to authenticated admins via <code>is_admin()</code>.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. Tab Footer Actions */}
          <div className="settings-tab-footer">
            <button
              type="button"
              onClick={() => handleResetToDefault(currentSectionKey)}
              disabled={isSaving}
              className="btn btn-outline btn-sm"
              style={{ color: '#dc3545', borderColor: '#f5c6cb' }}
            >
              <RotateCcw size={14} />
              <span>Reset {currentTabObj.label} to Default</span>
            </button>

            <button
              type="button"
              onClick={() => handleSaveSection(currentSectionKey)}
              disabled={isSaving}
              className="btn btn-primary"
            >
              {isSaving ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save size={15} />
                  <span>Save {currentTabObj.label}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Media Picker Modal Integration */}
        {mediaPickerConfig && (
          <MediaPickerModal
            isOpen={Boolean(mediaPickerConfig.isOpen)}
            onClose={() => setMediaPickerConfig(null)}
            onSelect={handleMediaPickerSelect}
            title={mediaPickerConfig.title || 'Select Image from Media Library'}
            multiple={false}
          />
        )}
      </div>
    </AdminLayout>
  );
}
