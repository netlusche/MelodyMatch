import React, { useState, useEffect } from 'react';
import { X, Music2, Play, Square, Info, Heart, Disc } from 'lucide-react';
import { translations } from '../i18n/translations';
import { audioManager } from '../services/audio';
import { addFavorite, removeFavorite, getFavorites } from '../utils/favorites';
import { TrackInfoModal } from './TrackInfoModal';
import { Song, PlayedSong } from '../types';
import { refreshPreviewUrls } from '../services/api';

interface RoundReplayModalProps {
  history: PlayedSong[];
  lang: 'en' | 'de';
  onClose: () => void;
}

export const RoundReplayModal: React.FC<RoundReplayModalProps> = ({ history, lang, onClose }) => {
  const t = translations[lang] || translations.en;
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [favIds, setFavIds] = useState<number[]>([]);
  const [selectedSongForInfo, setSelectedSongForInfo] = useState<Song | null>(null);
  const [refreshedHistory, setRefreshedHistory] = useState<PlayedSong[]>(history);

  useEffect(() => {
    setFavIds(getFavorites().map(s => s.id));
    let cancelled = false;
    refreshPreviewUrls(history.map(h => h.song)).then(refreshedSongs => {
      if (cancelled) return;
      setRefreshedHistory(history.map((h, i) => ({ ...h, song: refreshedSongs[i] })));
    });
    return () => {
      cancelled = true;
      audioManager.pause();
    };
  }, []);

  const nowPlaying = playingId !== null
    ? refreshedHistory.find(h => h.song.id === playingId)?.song ?? null
    : null;

  const handleTogglePlay = (song: Song) => {
    if (!song.previewUrl) return;
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

  const handleToggleFav = (song: Song) => {
    if (favIds.includes(song.id)) {
      removeFavorite(song.id);
      setFavIds(ids => ids.filter(id => id !== song.id));
    } else {
      addFavorite(song);
      setFavIds(ids => [...ids, song.id]);
    }
  };

  const formatPoints = (results?: { title: number; artist: number; year: number }) => {
    if (!results) return t.noneLabel;
    const parts: string[] = [];
    if (results.title > 0) parts.push(`${t.titleLabel} (+${results.title})`);
    if (results.artist > 0) parts.push(`${t.artistLabel} (+${results.artist})`);
    if (results.year > 0) parts.push(`${t.yearLabel} (+${results.year})`);
    return parts.length > 0 ? parts.join(', ') : t.noneLabel;
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-card" style={{ maxWidth: '560px' }} onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="modal-header" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Music2 size={20} className="text-primary" />
              <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                {lang === 'de' ? 'Gespielte Songs' : 'Played Songs'}
              </span>
              <span className="favorites-badge">{history.length}</span>
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

          {/* Turntable player */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '1.25rem 1rem 1rem',
            borderBottom: '1px solid var(--border)',
          }}>
            <div style={{ position: 'relative', width: 140, height: 140 }}>
              <div style={{
                position: 'absolute', inset: 0,
                borderRadius: '50%',
                background: 'radial-gradient(circle at 50% 50%, #2a2a2a 28%, #111 29%, #1a1a1a 60%, #0d0d0d 100%)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                animation: nowPlaying ? 'spin 5s linear infinite' : 'none',
              }} />
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
            {refreshedHistory.map(({ song, player, results }) => {
              const isFav = favIds.includes(song.id);
              return (
                <div key={song.id} className="fav-item-row" style={{ alignItems: 'flex-start', padding: '0.5rem' }}>

                  {/* Cover */}
                  <button
                    type="button"
                    className={`cover-play-wrapper ${playingId === song.id ? 'playing' : ''}`}
                    onClick={() => handleTogglePlay(song)}
                    title={playingId === song.id ? t.pausePreview : t.playPreview}
                    style={{ width: 56, height: 56, borderRadius: '8px', cursor: song.previewUrl ? 'pointer' : 'default', flexShrink: 0 }}
                  >
                    <img src={song.artworkUrl} alt={song.title} className="cover-play-img" />
                    {song.previewUrl && (
                      <>
                        <div className="play-overlay">
                          {playingId === song.id ? <Square size={14} fill="#fff" /> : <Play size={14} fill="#fff" />}
                        </div>
                        <div className="play-badge-mobile">
                          {playingId === song.id ? <Square size={7} fill="#fff" /> : <Play size={7} fill="#fff" />}
                        </div>
                      </>
                    )}
                  </button>

                  {/* Info */}
                  <div className="fav-item-info" style={{ gap: '0.1rem' }}>
                    <div className="fav-item-title">{song.title}</div>
                    <div className="fav-item-details">{song.artist} ({song.year})</div>
                    {player && (
                      <div className="fav-item-details" style={{ fontSize: '0.7rem' }}>
                        {t.playedBy}: <span style={{ color: 'var(--text)', fontWeight: 500 }}>{player}</span>
                      </div>
                    )}
                    {results && (
                      <div className="fav-item-details" style={{ fontSize: '0.7rem' }}>
                        {t.pointsFor}: <span style={{ color: 'var(--text)', fontWeight: 500 }}>{formatPoints(results)}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="fav-item-actions">
                    <button
                      type="button"
                      className="fav-action-btn info"
                      onClick={() => setSelectedSongForInfo(song)}
                      title="Info"
                    >
                      <Info size={14} />
                    </button>
                    <button
                      type="button"
                      className="fav-action-btn"
                      onClick={() => handleToggleFav(song)}
                      style={{ color: isFav ? 'var(--danger)' : 'var(--text-muted)', background: isFav ? 'rgba(239,68,68,0.1)' : undefined }}
                      title={isFav ? 'Remove from liked' : 'Add to liked'}
                    >
                      <Heart size={14} fill={isFav ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                </div>
              );
            })}
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
    </>
  );
};
