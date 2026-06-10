import React, { useState, useEffect } from 'react';
import { useGame } from '../state/GameContext';
import { translations } from '../i18n/translations';
import { CheckCircle, XCircle, ChevronRight, Heart, Play, Square, Info, Maximize2, X, Music } from 'lucide-react';
import confetti from 'canvas-confetti';
import { addFavorite, removeFavorite, isFavorite, clearFavorites, getFavorites } from '../utils/favorites';
import { LikedSongsFullOverlay } from './LikedSongsFullOverlay';
import { getThemeConfettiColors } from '../utils/confettiColors';
import { audioManager } from '../services/audio';
import { TrackInfoModal } from './TrackInfoModal';

export const TurnResultScreen: React.FC = () => {
  const { state, dispatch } = useGame();
  const t = translations[state.lang as keyof typeof translations] || translations.en;
  
  const points = state.turnPoints;
  const isCorrect = points > 0;

  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [isFav, setIsFav] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showZoom, setShowZoom] = useState(false);
  const [showFavFull, setShowFavFull] = useState(false);

  // Sync state with HTML5 audio events (play, pause, ended)
  useEffect(() => {
    const audio = audioManager.getAudio();
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    // Delayed initial sync to let Safari's audio state transition settle
    const syncTimer = setTimeout(() => {
      setIsPlaying(!audio.paused);
    }, 150);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      clearTimeout(syncTimer);
    };
  }, []);

  useEffect(() => {
    if (isCorrect) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: getThemeConfettiColors(state.theme)
      });
    }
  }, [isCorrect, state.theme]);

  useEffect(() => {
    if (state.currentSong) {
      setIsFav(isFavorite(state.currentSong.id));
    }
  }, [state.currentSong]);

  const handleToggleFavorite = () => {
    if (!state.currentSong) return;
    if (isFav) {
      removeFavorite(state.currentSong.id);
      setIsFav(false);
    } else {
      const result = addFavorite(state.currentSong);
      if (result.full) {
        setShowFavFull(true);
      } else if (result.success) {
        setIsFav(true);
      }
    }
  };

  const handleTogglePlay = () => {
    if (!state.currentSong) return;
    if (isPlaying) {
      audioManager.pause();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      audioManager.playSong(state.currentSong.previewUrl).catch(err => {
        console.warn("Playback failed:", err);
        setIsPlaying(false);
      });
    }
  };

  const handleNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    audioManager.pause();
    dispatch({ type: 'NEXT_TURN' });
  };

  return (
    <div className="screen center-content fade-in" style={{ padding: '0.5rem', gap: '0.75rem' }}>
      <div className="text-muted text-center font-bold glow-text" style={{ fontSize: '1.1rem', width: '100%', marginBottom: '-0.5rem' }}>
        {t.round} {state.currentRound} / {state.totalRounds}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '0.25rem' }} className="scale-in">
        <div className={`icon-container ${isCorrect ? 'success-glow' : 'danger-glow'} mb-1`} style={{ padding: '0.25rem' }}>
          {isCorrect ? <CheckCircle size={48} className="icon text-success" /> : <XCircle size={48} className="icon text-danger" />}
        </div>
        <h2 className={`title-gradient text-center ${isCorrect ? 'text-success' : 'text-danger'} m-0`} style={{ fontSize: '2rem' }}>
          {isCorrect ? t.correct : t.wrong}
        </h2>
      </div>

      {state.currentSong && (
        <div className="song-info-card w-full max-w-sm fade-in drop-shadow" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', borderRadius: '12px', background: 'var(--card)', border: '1px solid var(--border)', position: 'relative' }}>
          {state.currentSong.artworkUrl ? (
            <div 
              className={`cover-play-wrapper ${isPlaying ? 'playing' : ''}`}
              onClick={handleTogglePlay}
              title={isPlaying ? t.pausePreview : t.playPreview}
              style={{
                width: 80,
                height: 80,
                borderRadius: '8px'
              }}
            >
              <img src={state.currentSong.artworkUrl} alt="Album Art" className="cover-play-img" />
              <div className="play-overlay">
                {isPlaying ? <Square size={20} fill="#fff" /> : <Play size={20} fill="#fff" />}
              </div>
              <div className="play-badge-mobile">
                {isPlaying ? <Square size={8} fill="#fff" /> : <Play size={8} fill="#fff" />}
              </div>
              <button 
                type="button"
                className="zoom-overlay-badge"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowZoom(true);
                }}
                title={t.zoomHint}
                style={{ border: 'none', outline: 'none' }}
              >
                <Maximize2 size={10} />
              </button>
            </div>
          ) : (
            <div style={{ width: 60, height: 60, borderRadius: '8px', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Music size={24} className="text-muted" />
            </div>
          )}
          <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1, paddingRight: '4.2rem' }}>
            <span style={{ fontWeight: 800, fontSize: '1.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {state.currentSong.title}
            </span>
            <span className="text-muted" style={{ fontWeight: 600, fontSize: '0.9rem' }}>{state.currentSong.artist}</span>
            <span className="text-muted" style={{ fontSize: '0.8rem' }}>{state.currentSong.year}</span>
          </div>
          <div style={{
            position: 'absolute',
            right: '0.5rem',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.15rem'
          }}>
            <button 
              type="button"
              className="info-btn-trigger"
              onClick={() => setShowInfo(true)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0.4rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)'
              }}
            >
              <Info size={20} />
            </button>
            <button 
              className="fav-toggle-btn"
              onClick={handleToggleFavorite}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0.4rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isFav ? 'var(--danger)' : 'var(--text-muted)',
                transition: 'color 0.2s ease, transform 0.2s ease',
              }}
            >
              <Heart size={20} fill={isFav ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
      )}
      
      <div className="score-badge mt-2 w-full max-w-sm" style={{ padding: '0.75rem 1rem', alignItems: 'stretch' }}>
        <h2 className="text-center mb-2 m-0" style={{ fontSize: '1.25rem' }}>Total: +{points} Points</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'var(--row-bg)', borderRadius: '8px', fontSize: '0.95rem' }}>
            <span>Song Title:</span>
            <span className={state.turnResults?.title > 0 ? 'text-success' : 'text-danger'} style={{ fontWeight: 800 }}>+{state.turnResults?.title || 0}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'var(--row-bg)', borderRadius: '8px', fontSize: '0.95rem' }}>
            <span>Artist:</span>
            <span className={state.turnResults?.artist > 0 ? 'text-success' : 'text-danger'} style={{ fontWeight: 800 }}>+{state.turnResults?.artist || 0}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'var(--row-bg)', borderRadius: '8px', fontSize: '0.95rem' }}>
            <span>Year:</span>
            <span className={state.turnResults?.year > 0 ? 'text-success' : 'text-danger'} style={{ fontWeight: 800 }}>+{state.turnResults?.year || 0}</span>
          </div>
        </div>
      </div>
      
      <div className="current-standings mt-3 w-full max-w-sm">
        <h3 className="text-center text-muted mb-1" style={{ fontSize: '1rem' }}>Current Standings</h3>
        <div className="standings-list rounded-xl overflow-hidden custom-border">
          {state.players.map((p, idx) => (
            <div key={p.id} className={`standing-row ${idx === state.currentPlayerIndex ? 'active-player-row' : ''}`} style={{ padding: '0.5rem 1rem', fontSize: '1rem' }}>
              <span className="standing-name">{p.name}</span>
              <span className="standing-score">{p.score} pts</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 w-full max-w-sm">
        <button className="option-button primary large w-full group" onClick={handleNext}>
          <span>{t.next}</span>
          <ChevronRight size={24} className="group-hover-translate" />
        </button>
      </div>

      {showFavFull && (
        <LikedSongsFullOverlay
          lang={state.lang}
          songs={getFavorites()}
          onClose={() => setShowFavFull(false)}
          onClear={() => { clearFavorites(); setIsFav(false); }}
        />
      )}

      {showInfo && state.currentSong && (
        <TrackInfoModal 
          song={state.currentSong}
          lang={state.lang}
          onClose={() => setShowInfo(false)}
        />
      )}

      {showZoom && state.currentSong && state.currentSong.artworkUrl && (
        <div className="zoom-overlay" onClick={() => setShowZoom(false)}>
          <div className="zoom-overlay-card" onClick={e => e.stopPropagation()}>
            <img src={state.currentSong.artworkUrl} alt={state.currentSong.title} className="zoom-artwork" />
            <button 
              type="button" 
              className="icon-button outline zoom-close-btn"
              onClick={() => setShowZoom(false)}
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
