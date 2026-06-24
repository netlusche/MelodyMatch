import React, { useState, useEffect } from 'react';
import { useGame } from '../state/GameContext';
import { translations } from '../i18n/translations';
import { Song, PlayedSong } from '../types';
import { Trophy, RotateCcw, Medal, Heart, Play, Square, Info, Maximize2, X, Expand } from 'lucide-react';
import confetti from 'canvas-confetti';
import { addFavorite, removeFavorite, getFavorites, clearFavorites } from '../utils/favorites';
import { LikedSongsFullOverlay } from './LikedSongsFullOverlay';
import { getThemeConfettiColors } from '../utils/confettiColors';
import { TrackInfoModal } from './TrackInfoModal';
import { RoundReplayModal } from './RoundReplayModal';
import { audioManager } from '../services/audio';
import { refreshPreviewUrls, fetchSongs } from '../services/api';
import { ShareBar } from './ShareBar';
import { AppFooter } from './AppFooter';

export const FinalResultsScreen: React.FC = () => {
  const { state, dispatch } = useGame();
  const t = translations[state.lang as keyof typeof translations] || translations.en;

  // Sort players descending by score
  const sortedPlayers = [...state.players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];

  const [favIds, setFavIds] = useState<number[]>([]);
  const [showReplayModal, setShowReplayModal] = useState(false);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [selectedSongForInfo, setSelectedSongForInfo] = useState<Song | null>(null);
  const [zoomUrl, setZoomUrl] = useState<string | null>(null);
  const [showFavFull, setShowFavFull] = useState(false);

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
          if (audio) {
            audio.onended = () => setPlayingId(null);
          }
        })
        .catch(async (e) => {
          if (e.name !== 'NotAllowedError') {
            try {
              const refreshed = await refreshPreviewUrls([song]);
              const freshUrl = refreshed[0]?.previewUrl;
              if (freshUrl) {
                await audioManager.playSong(freshUrl, false);
                const audio = audioManager.getAudio();
                if (audio) audio.onended = () => setPlayingId(null);
                return;
              }
            } catch {}
          }
          console.warn("Preview playback failed", e);
          setPlayingId(null);
        });
      setPlayingId(song.id);
    }
  };

  useEffect(() => {
    return () => {
      audioManager.pause();
    };
  }, []);

  useEffect(() => {
    setFavIds(getFavorites().map(s => s.id));
  }, []);

  const handleToggleFav = (song: Song) => {
    if (favIds.includes(song.id)) {
      removeFavorite(song.id);
      setFavIds(favIds.filter(id => id !== song.id));
    } else {
      const result = addFavorite(song);
      if (result.full) {
        setShowFavFull(true);
      } else if (result.success) {
        setFavIds([...favIds, song.id]);
      }
    }
  };

  React.useEffect(() => {
    const duration = 3000;
    const end = Date.now() + duration;
    const colors = getThemeConfettiColors(state.theme);

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, [state.theme]);

  const formatPointsBreakdown = (res: PlayedSong['results']) => {
    const parts: string[] = [];
    if (res.title > 0) parts.push(`${t.titleLabel} (+${res.title})`);
    if (res.artist > 0) parts.push(`${t.artistLabel} (+${res.artist})`);
    if (res.year > 0) parts.push(`${t.yearLabel} (+${res.year})`);
    return parts.length > 0 ? parts.join(', ') : t.noneLabel;
  };

  const [isFetchingPool, setIsFetchingPool] = React.useState(false);
  const [playAgainError, setPlayAgainError] = React.useState(false);

  const handlePlayAgainSame = async () => {
    if (isFetchingPool) return;
    audioManager.pause();
    setIsFetchingPool(true);
    setPlayAgainError(false);
    try {
      const poolSize = Math.max(100, state.players.length * state.totalRounds + 10);
      const pool = await fetchSongs(poolSize, state.genres);
      if (!pool || pool.length === 0) throw new Error('empty pool');
      dispatch({ type: 'PLAY_AGAIN_SAME', payload: { pool } });
    } catch {
      setPlayAgainError(true);
      setIsFetchingPool(false);
    }
  };


  return (
    <div className="screen final-results fade-in" style={{ gap: '0.5rem' }}>
      <div className="winner-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Trophy size={48} className="icon gold-glow" />
        <h1 className="title-gradient" style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0.25rem 0 0 0', lineHeight: 1.1 }}>{t.winner}</h1>
        <h2 className="winner-name text-gold glow-text" style={{ fontSize: '1.25rem', margin: '0.1rem 0' }}>{winner?.name}</h2>
        <div className="score-badge" style={{ padding: '0.35rem 1rem', borderRadius: '12px', display: 'inline-flex', flexDirection: 'row', alignItems: 'center', gap: '0.35rem', marginTop: '0.25rem' }}>
          <span className="score-value" style={{ fontSize: '1.2rem', fontWeight: 800 }}>{winner?.score}</span>
          <span className="score-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.8 }}>Points</span>
        </div>
      </div>

      <div className="leaderboard mt-3">
        {sortedPlayers.map((player, index) => (
          <div key={player.id} className={`leaderboard-row ${index === 0 ? 'first-place' : ''}`}>
            <div className="rank">
              {index === 0 ? <Medal size={24} className="text-gold" /> : `#${index + 1}`}
            </div>
            <div className="player-info">
              <span className="name">{player.name}</span>
            </div>
            <div className="score">{player.score} pts</div>
          </div>
        ))}
      </div>

      {state.history && state.history.length > 0 && (
        <div className="played-songs-history mt-3 w-full">
          <h3 className="section-title" style={{ fontSize: '1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Heart size={16} fill="currentColor" className="text-danger" />
            <span style={{ flex: 1 }}>{t.playedSongs}</span>
            <button
              type="button"
              className="option-button outline sm"
              style={{ fontSize: '0.78rem', padding: '0.2rem 0.6rem', minHeight: '28px', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
              onClick={() => setShowReplayModal(true)}
            >
              <Expand size={13} />
              <span>{state.lang === 'de' ? 'Player' : 'Player'}</span>
            </button>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '340px', overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingRight: '4px' }}>
            {state.history.map((playedSong) => {
              // Support legacy localStorage entries that predate the PlayedSong shape
              const entry = playedSong as PlayedSong;
              const song: Song = entry.song ?? (playedSong as unknown as Song);
              const player = entry.player || '';
              const results = entry.results;
              const isFav = favIds.includes(song.id);

              return (
                <div key={song.id} className="history-song-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', borderRadius: '12px', background: 'var(--card)', border: '1px solid var(--border)', position: 'relative' }}>
                  {song.artworkUrl ? (
                    <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
                      <button 
                        type="button"
                        className={`cover-play-wrapper ${playingId === song.id ? 'playing' : ''}`}
                        onClick={() => handleTogglePlay(song)} 
                        title={song.previewUrl ? (playingId === song.id ? t.pausePreview : t.playPreview) : undefined}
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          borderRadius: '8px',
                          cursor: 'pointer'
                        }}
                      >
                        <img src={song.artworkUrl} alt={song.title} className="cover-play-img" />
                        {song.previewUrl && (
                          <>
                            <div className="play-overlay">
                              {playingId === song.id ? <Square size={20} fill="#fff" /> : <Play size={20} fill="#fff" />}
                            </div>
                            <div className="play-badge-mobile">
                              {playingId === song.id ? <Square size={8} fill="#fff" /> : <Play size={8} fill="#fff" />}
                            </div>
                          </>
                        )}
                      </button>
                      <button 
                        type="button"
                        className="zoom-overlay-badge"
                        onClick={(e) => {
                          e.stopPropagation();
                          setZoomUrl(song.artworkUrl);
                        }}
                        title={t.zoomHint}
                        style={{ border: 'none', outline: 'none' }}
                      >
                        <Maximize2 size={10} />
                      </button>
                    </div>
                  ) : (
                    song.previewUrl && (
                      <button 
                        onClick={() => handleTogglePlay(song)}
                        title={playingId === song.id ? t.pausePreview : t.playPreview}
                        style={{
                          width: 80,
                          height: 80,
                          borderRadius: '8px',
                          background: 'var(--badge-bg)',
                          border: '1px solid var(--border)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text)',
                          flexShrink: 0
                        }}
                      >
                        {playingId === song.id ? <Square size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                      </button>
                    )
                  )}
                  <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1, paddingRight: '3.8rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text)' }}>
                      {song.title}
                    </span>
                    <span className="text-muted" style={{ fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '0.1rem' }}>
                      {song.artist} ({song.year})
                    </span>
                    {player && (
                      <span className="text-muted" style={{ fontSize: '0.7rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '0.1rem' }}>
                        {t.playedBy}: <span style={{ color: 'var(--text)', fontWeight: 500 }}>{player}</span>
                      </span>
                    )}
                    {results && (
                      <span className="text-muted" style={{ fontSize: '0.7rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '0.1rem' }}>
                        {t.pointsFor}: <span style={{ color: 'var(--text)', fontWeight: 500 }}>{formatPointsBreakdown(results)}</span>
                      </span>
                    )}
                  </div>
                  <div style={{
                    position: 'absolute',
                    right: '0.4rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.1rem'
                  }}>
                    <button 
                      type="button"
                      className="info-btn-trigger"
                      onClick={() => setSelectedSongForInfo(song)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.35rem',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Info size={18} />
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleToggleFav(song)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.35rem',
                        color: isFav ? 'var(--danger)' : 'var(--text-muted)',
                        transition: 'color 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Heart size={18} fill={isFav ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-4 w-full" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <button
          className="option-button primary large w-full group"
          onClick={handlePlayAgainSame}
          disabled={isFetchingPool}
          style={{ opacity: isFetchingPool ? 0.7 : 1 }}
        >
          {isFetchingPool ? (
            <span className="spinner" style={{ width: 22, height: 22, borderWidth: 3 }} />
          ) : (
            <RotateCcw size={24} className="group-hover-spin" />
          )}
          <span>{t.playAgain}</span>
        </button>
        {playAgainError && (
          <p style={{ textAlign: 'center', color: 'var(--danger)', fontSize: '0.82rem', margin: 0 }}>
            {state.lang === 'de' ? 'Fehler beim Laden. Bitte nochmal versuchen.' : 'Could not load songs. Please try again.'}
          </p>
        )}
      </div>

      <div className="mt-3 w-full" style={{ paddingTop: '0.75rem' }}>
        <ShareBar
          lang={state.lang}
          shareText={t.shareText}
          copyLabel={t.copyLink}
          copiedLabel={t.copied}
          shareLabel={t.shareGame}
        />
      </div>

      <AppFooter />

      {showFavFull && (
        <LikedSongsFullOverlay
          lang={state.lang}
          songs={getFavorites()}
          onClose={() => setShowFavFull(false)}
          onClear={() => { clearFavorites(); setFavIds([]); }}
        />
      )}

      {showReplayModal && (
        <RoundReplayModal
          history={state.history}
          lang={state.lang as 'en' | 'de'}
          onClose={() => setShowReplayModal(false)}
        />
      )}

      {selectedSongForInfo && (
        <TrackInfoModal
          song={selectedSongForInfo}
          lang={state.lang}
          onClose={() => setSelectedSongForInfo(null)}
        />
      )}

      {zoomUrl && (
        <div className="zoom-overlay" onClick={() => setZoomUrl(null)}>
          <div className="zoom-overlay-card" onClick={e => e.stopPropagation()}>
            <img src={zoomUrl} alt="Zoomed Album Art" className="zoom-artwork" />
            <button 
              type="button" 
              className="icon-button outline zoom-close-btn"
              onClick={() => setZoomUrl(null)}
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
