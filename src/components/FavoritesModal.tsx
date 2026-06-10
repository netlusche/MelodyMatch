import React, { useState, useEffect } from 'react';
import { Song } from '../types';
import { X, Heart, Play, Square, Info, Trash2, Disc } from 'lucide-react';
import { translations } from '../i18n/translations';
import { audioManager } from '../services/audio';
import { removeFavorite, getFavorites } from '../utils/favorites';
import { TrackInfoModal } from './TrackInfoModal';

interface FavoritesModalProps {
  songs: Song[];
  lang: 'en' | 'de';
  onClose: () => void;
  onListChange: (updated: Song[]) => void;

}

export const FavoritesModal: React.FC<FavoritesModalProps> = ({
  songs,
  lang,
  onClose,
  onListChange,
}) => {
  const t = translations[lang] || translations.en;
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [list, setList] = useState<Song[]>(songs);
  const [selectedSongForInfo, setSelectedSongForInfo] = useState<Song | null>(null);

  useEffect(() => {
    setList(songs);
  }, [songs]);

  useEffect(() => {
    return () => { audioManager.pause(); };
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
                      title="Apple Music"
                    >
                      <svg viewBox="0 0 814 1000" width="11" height="13" fill="currentColor" aria-hidden="true">
                        <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.5-157.2-111.9c-43.7-57.9-84-145.3-84-227.9 0-205.2 132.4-314 261.4-314 70.7 0 129.5 47.9 173.7 47.9 42.7 0 109.2-50.1 188.5-50.1 30.4 0 134.6 2.6 198.3 99.2zm-234.3-181.7c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/>
                      </svg>
                    </a>
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
