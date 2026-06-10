import React, { useState, useEffect } from 'react';
import { Song } from '../types';
import { X, Heart, Play, Square, Info, Trash2, Maximize2, Disc } from 'lucide-react';
import { translations } from '../i18n/translations';
import { audioManager } from '../services/audio';
import { removeFavorite, getFavorites } from '../utils/favorites';
import { TrackInfoModal } from './TrackInfoModal';
import { refreshPreviewUrls } from '../services/api';

interface FavoritesModalProps {
  songs: Song[];
  lang: 'en' | 'de';
  onClose: () => void;
  onListChange: (updated: Song[]) => void;
  onZoom: (url: string) => void;
}

export const FavoritesModal: React.FC<FavoritesModalProps> = ({
  songs,
  lang,
  onClose,
  onListChange,
  onZoom,
}) => {
  const t = translations[lang] || translations.en;
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [list, setList] = useState<Song[]>(songs);
  const [selectedSongForInfo, setSelectedSongForInfo] = useState<Song | null>(null);

  useEffect(() => {
    setList(songs);
  }, [songs]);

  useEffect(() => {
    let cancelled = false;
    refreshPreviewUrls(songs).then(refreshed => {
      if (!cancelled) setList(refreshed);
    });
    return () => {
      cancelled = true;
      audioManager.pause();
    };
  }, []);

  const nowPlaying = list.find(s => s.id === playingId) ?? null;

  const handleTogglePlay = (song: Song) => {
    if (playingId === song.id) {
      audioManager.pause();
      setPlayingId(null);
    } else {
      audioManager.pause();
      audioManager.playSong(song.previewUrl, false)
        .then(() => {
          const audio = audioManager.getAudio();
          if (audio) audio.onended = () => setPlayingId(null);
        })
        .catch(() => setPlayingId(null));
      setPlayingId(song.id);
    }
  };

  const handleRemove = (id: number) => {
    removeFavorite(id);
    if (playingId === id) {
      audioManager.pause();
      setPlayingId(null);
    }
    const updated = getFavorites();
    setList(updated);
    onListChange(updated);
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-card" style={{ maxWidth: '560px' }} onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="modal-header" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Heart size={20} fill="currentColor" className="text-danger" />
              <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{t.favorites}</span>
              <span className="favorites-badge">{list.length}</span>
            </div>
            <button
              type="button"
              className="option-button outline sm"
              style={{ minHeight: '32px', width: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}
              onClick={onClose}
              aria-label={t.closeBtn}
            >
              <X size={16} />
            </button>
          </div>

          {/* Turntable player — always visible */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '1.25rem 1rem 1rem',
            borderBottom: '1px solid var(--border)',
          }}>
            <div style={{ position: 'relative', width: 140, height: 140 }}>
              {/* Vinyl base — always visible */}
              <div style={{
                position: 'absolute', inset: 0,
                borderRadius: '50%',
                background: 'radial-gradient(circle at 50% 50%, #2a2a2a 28%, #111 29%, #1a1a1a 60%, #0d0d0d 100%)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                animation: nowPlaying ? 'spin 5s linear infinite' : 'none',
              }} />
              {/* Center hole dot */}
              <div style={{
                position: 'absolute',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 14, height: 14,
                borderRadius: '50%',
                background: 'var(--card)',
                zIndex: 3,
                boxShadow: '0 0 0 2px rgba(255,255,255,0.1)',
              }} />
              {/* Album cover — fades in when playing */}
              {nowPlaying && (
                <img
                  key={nowPlaying.id}
                  src={nowPlaying.artworkUrl}
                  alt={nowPlaying.title}
                  style={{
                    position: 'absolute', inset: 0,
                    width: '100%', height: '100%',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    animation: 'spin 5s linear infinite, favCoverFadeIn 0.5s ease forwards',
                    zIndex: 2,
                  }}
                />
              )}
              {/* Disc icon fallback when idle */}
              {!nowPlaying && (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  zIndex: 2,
                }}>
                  <Disc size={44} style={{ color: 'rgba(255,255,255,0.15)' }} />
                </div>
              )}
            </div>

            {nowPlaying ? (
              <>
                <div style={{ textAlign: 'center' }}>
                  <div className="fav-item-title" style={{ fontSize: '1rem' }}>{nowPlaying.title}</div>
                  <div className="fav-item-details">{nowPlaying.artist} ({nowPlaying.year})</div>
                </div>
                <button
                  type="button"
                  className="option-button outline sm"
                  style={{ minHeight: '32px', padding: '0.25rem 0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}
                  onClick={() => handleTogglePlay(nowPlaying)}
                >
                  <Square size={12} fill="currentColor" />
                  <span>{t.pausePreview}</span>
                </button>
              </>
            ) : (
              <div className="text-muted" style={{ fontSize: '0.82rem', opacity: 0.5 }}>
                {lang === 'de' ? 'Song aus der Liste auswählen' : 'Select a song from the list'}
              </div>
            )}
          </div>

          {/* Song list */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {list.length === 0 ? (
              <p className="text-center text-muted" style={{ padding: '2rem', fontSize: '0.9rem' }}>
                {t.noFavorites}
              </p>
            ) : (
              list.map(song => (
                <div key={song.id} className="fav-item-row">
                  <div style={{ position: 'relative', width: '64px', height: '64px', flexShrink: 0 }}>
                    <button
                      type="button"
                      className={`cover-play-wrapper ${playingId === song.id ? 'playing' : ''}`}
                      onClick={() => handleTogglePlay(song)}
                      title={playingId === song.id ? t.pausePreview : t.playPreview}
                      style={{ width: '100%', height: '100%', borderRadius: '8px', cursor: 'pointer' }}
                    >
                      <img src={song.artworkUrl} alt={song.title} className="cover-play-img" />
                      <div className="play-overlay">
                        {playingId === song.id ? <Square size={16} fill="#fff" /> : <Play size={16} fill="#fff" />}
                      </div>
                      <div className="play-badge-mobile">
                        {playingId === song.id ? <Square size={8} fill="#fff" /> : <Play size={8} fill="#fff" />}
                      </div>
                    </button>
                    <button
                      type="button"
                      className="zoom-overlay-badge"
                      onClick={e => { e.stopPropagation(); onZoom(song.artworkUrl); }}
                      title={t.zoomHint}
                      style={{ border: 'none', outline: 'none' }}
                    >
                      <Maximize2 size={10} />
                    </button>
                  </div>

                  <div className="fav-item-info">
                    <div className="fav-item-title">{song.title}</div>
                    <div className="fav-item-details">{song.artist} ({song.year})</div>
                  </div>

                  <div className="fav-item-actions">
                    <button
                      type="button"
                      className="fav-action-btn info"
                      onClick={() => setSelectedSongForInfo(song)}
                      title="Info"
                    >
                      <Info size={14} />
                    </button>
                    <a
                      href={`https://www.deezer.com/search/${encodeURIComponent(song.artist + ' ' + song.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="fav-action-btn search-deezer"
                      title="Deezer"
                    >D</a>
                    <a
                      href={`https://music.apple.com/search?term=${encodeURIComponent(song.artist + ' ' + song.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="fav-action-btn search-itunes"
                      title="iTunes"
                    ></a>
                    <button
                      className="fav-action-btn delete"
                      onClick={() => handleRemove(song.id)}
                      title="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>

      {selectedSongForInfo && (
        <TrackInfoModal
          song={selectedSongForInfo}
          lang={lang}
          onClose={() => setSelectedSongForInfo(null)}
        />
      )}

      <style>{`
        @keyframes favCoverFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </>
  );
};
