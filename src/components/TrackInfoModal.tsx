import React, { useState, useEffect } from 'react';
import { Song } from '../types';
import { X, Loader2, Music } from 'lucide-react';
import { translations } from '../i18n/translations';
import { fetchWikipediaSummary, getGeniusUrl, WikiResult } from '../services/infoService';

interface TrackInfoModalProps {
  song: Song;
  lang: 'en' | 'de';
  onClose: () => void;
}

export const TrackInfoModal: React.FC<TrackInfoModalProps> = ({ song, lang, onClose }) => {
  const [wikiData, setWikiData] = useState<WikiResult | null>(null);
  const [isLoadingWiki, setIsLoadingWiki] = useState(true);

  const t = translations[lang] || translations.en;

  useEffect(() => {
    let isMounted = true;
    
    setIsLoadingWiki(true);
    setWikiData(null);

    // Fetch Wikipedia Info
    fetchWikipediaSummary(song.title, song.artist)
      .then(res => {
        if (isMounted) {
          setWikiData(res);
          setIsLoadingWiki(false);
        }
      })
      .catch(err => {
        console.warn("Error loading wiki summary", err);
        if (isMounted) setIsLoadingWiki(false);
      });

    return () => {
      isMounted = false;
    };
  }, [song]);

  const geniusUrl = getGeniusUrl(song.artist, song.title);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          {song.artworkUrl ? (
            <img src={song.artworkUrl} alt={song.title} className="modal-artwork" />
          ) : (
            <div className="modal-artwork" style={{ background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Music size={24} className="text-muted" />
            </div>
          )}
          <div className="modal-header-text">
            <h3 className="modal-title">{song.title}</h3>
            <p className="modal-subtitle">{song.artist} ({song.year})</p>
          </div>
          <button 
            type="button" 
            className="icon-button outline" 
            onClick={onClose} 
            style={{ padding: '0.4rem', borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Area */}
        <div className="modal-body" style={{ minHeight: '120px' }}>
          {isLoadingWiki ? (
            <div style={{ display: 'flex', flex: 1, height: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.75rem', padding: '2rem 0' }}>
              <Loader2 size={36} className="loading-spinner" />
            </div>
          ) : wikiData ? (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="wiki-badge">{t[wikiData.badge as keyof typeof t] || wikiData.badge}</span>
              <p style={{ margin: 0, fontSize: '0.92rem', textAlign: 'justify', lineHeight: '1.4' }}>{wikiData.extract}</p>
              <a 
                href={wikiData.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ alignSelf: 'flex-start', marginTop: '0.75rem', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary)', fontWeight: 700 }}
              >
                <span>Wikipedia ↗</span>
              </a>
            </div>
          ) : (
            <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', padding: '1rem' }}>
              <p>{t.noWikiInfo}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <a 
            href={geniusUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="option-button primary sm w-full"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', minHeight: '40px' }}
          >
            <span>{t.geniusBtn}</span>
          </a>
        </div>
      </div>
    </div>
  );
};
