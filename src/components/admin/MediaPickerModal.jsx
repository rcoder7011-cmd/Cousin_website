import React, { useState, useEffect } from 'react';
import { Search, X, Check, FileImage, RefreshCw } from 'lucide-react';
import { getMediaItems } from '../../services/mediaService';
import './MediaPickerModal.css';

export default function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
  multiple = false,
  filterBucket = 'all'
}) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUrls, setSelectedUrls] = useState([]);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function load() {
      setIsLoading(true);
      const { data } = await getMediaItems({
        search,
        bucket: filterBucket,
        sortBy: 'newest'
      });
      if (isMounted) {
        setItems(data || []);
        setIsLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, [isOpen, search, filterBucket]);

  if (!isOpen) return null;

  const handleToggleSelect = (item) => {
    if (multiple) {
      setSelectedUrls(prev =>
        prev.some(u => u.url === item.url)
          ? prev.filter(u => u.url !== item.url)
          : [...prev, item]
      );
    } else {
      setSelectedUrls([item]);
    }
  };

  const handleConfirm = () => {
    if (selectedUrls.length === 0) return;
    if (multiple) {
      onSelect(selectedUrls);
    } else {
      onSelect(selectedUrls[0].url, selectedUrls[0]);
    }
    onClose();
  };

  return (
    <div className="media-picker-overlay" role="dialog" aria-modal="true">
      <div className="media-picker-card">
        {/* Header */}
        <div className="media-picker-header">
          <h2 className="media-picker-title">Select from Media Library</h2>
          <button type="button" onClick={onClose} className="drawer-close-btn" aria-label="Close picker">
            <X size={18} />
          </button>
        </div>

        {/* Search Toolbar */}
        <div className="media-picker-toolbar">
          <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
            <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }} />
            <input
              type="text"
              placeholder="Search library images..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="toolbar-search-input"
              style={{ fontSize: '0.84rem', padding: '0.45rem 0.75rem 0.45rem 2.2rem' }}
            />
          </div>

          <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
            {selectedUrls.length} image{selectedUrls.length !== 1 ? 's' : ''} selected
          </span>
        </div>

        {/* Grid Body */}
        <div className="media-picker-grid-wrap">
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <RefreshCw size={28} className="animate-spin" color="var(--admin-accent)" style={{ margin: '0 auto 0.75rem auto' }} />
              <div style={{ fontSize: '0.86rem', color: 'var(--color-text-muted)' }}>Loading media library...</div>
            </div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
              <FileImage size={36} color="var(--admin-accent)" style={{ marginBottom: '0.5rem' }} />
              <div style={{ fontWeight: 600, color: 'var(--admin-primary)', fontSize: '0.95rem' }}>No Images Found</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>Try adjusting your search terms.</div>
            </div>
          ) : (
            <div className="media-picker-grid">
              {items.map((item) => {
                const isSelected = selectedUrls.some(u => u.url === item.url);
                return (
                  <div
                    key={item.id}
                    className={`picker-thumb-card ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => handleToggleSelect(item)}
                  >
                    <img
                      src={item.url}
                      alt={item.name}
                      className="picker-thumb-img"
                      loading="lazy"
                    />
                    <div className="picker-thumb-name" title={item.name}>
                      {item.name}
                    </div>
                    {isSelected && (
                      <div style={{
                        position: 'absolute',
                        top: '0.4rem',
                        right: '0.4rem',
                        background: 'var(--admin-primary)',
                        color: '#ffffff',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Check size={12} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="media-picker-footer">
          <button type="button" onClick={onClose} className="btn btn-outline" style={{ fontSize: '0.84rem' }}>
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={selectedUrls.length === 0}
            className="btn btn-primary"
            style={{ fontSize: '0.84rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Check size={14} />
            <span>Select Image{multiple && selectedUrls.length > 1 ? 's' : ''}</span>
          </button>
        </div>
      </div>
    </div>
  );
}