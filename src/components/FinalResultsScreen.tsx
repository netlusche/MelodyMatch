import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../state/GameContext';
import { translations } from '../i18n/translations';
import { Trophy, RotateCcw, Medal, Heart, Play, Square } from 'lucide-react';
import confetti from 'canvas-confetti';
import { addFavorite, removeFavorite, getFavorites } from '../utils/favorites';
import { getThemeConfettiColors } from '../utils/confettiColors';

export const FinalResultsScreen: React.FC = () => {
  const { state, dispatch } = useGame();
  const t = translations[state.lang as keyof typeof translations] || translations.en;

  // Sort players descending by score
  const sortedPlayers = [...state.players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];

  const [favIds, setFavIds] = useState<number[]>([]);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleTogglePlay = (song: any) => {
    if (!song.previewUrl) return;
    if (playingId === song.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(song.previewUrl);
      audioRef.current.play().catch(e => console.warn("Preview playback failed", e));
      audioRef.current.onended = () => setPlayingId(null);
      setPlayingId(song.id);
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  useEffect(() => {
    setFavIds(getFavorites().map(s => s.id));
  }, []);

  const handleToggleFav = (song: any) => {
    if (favIds.includes(song.id)) {
      removeFavorite(song.id);
      setFavIds(favIds.filter(id => id !== song.id));
    } else {
      addFavorite(song);
      setFavIds([...favIds, song.id]);
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

  const [isTransitioning, setIsTransitioning] = React.useState(false);

  const handlePlayAgain = () => {
    if (isTransitioning) return;
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsTransitioning(true);
    dispatch({ type: 'PLAY_AGAIN' });
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
            <span>{t.playedSongs}</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '205px', overflowY: 'auto', paddingRight: '4px' }}>
            {state.history.map((song) => {
              const isFav = favIds.includes(song.id);
              return (
                <div key={song.id} className="history-song-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', borderRadius: '12px', background: 'var(--card)', border: '1px solid var(--border)', position: 'relative' }}>
                  {song.artworkUrl ? (
                    <div 
                      onClick={() => handleTogglePlay(song)} 
                      style={{ 
                        position: 'relative', 
                        width: 44, 
                        height: 44, 
                        borderRadius: '6px', 
                        overflow: 'hidden', 
                        cursor: song.previewUrl ? 'pointer' : 'default',
                        flexShrink: 0
                      }}
                    >
                      <img src={song.artworkUrl} alt={song.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {song.previewUrl && (
                        <div 
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: playingId === song.id ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: playingId === song.id ? 1 : 0,
                            transition: 'opacity 0.2s ease',
                            color: '#fff',
                          }}
                          className="play-overlay"
                        >
                          {playingId === song.id ? <Square size={16} fill="#fff" /> : <Play size={16} fill="#fff" />}
                        </div>
                      )}
                    </div>
                  ) : (
                    song.previewUrl && (
                      <button 
                        onClick={() => handleTogglePlay(song)}
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '6px',
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
                        {playingId === song.id ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                      </button>
                    )
                  )}
                  <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1, paddingRight: '2rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {song.title}
                    </span>
                    <span className="text-muted" style={{ fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.artist} ({song.year})</span>
                  </div>
                  <button 
                    onClick={() => handleToggleFav(song)}
                    style={{
                      position: 'absolute',
                      right: '0.5rem',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.4rem',
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
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-4 w-full">
        <button className="option-button primary large w-full group" onClick={handlePlayAgain}>
          <RotateCcw size={24} className="group-hover-spin" />
          <span>{t.playAgain}</span>
        </button>
      </div>
    </div>
  );
};
