import React from 'react';
import { useGame } from '../state/GameContext';
import { translations } from '../i18n/translations';
import { CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import confetti from 'canvas-confetti';

export const TurnResultScreen: React.FC = () => {
  const { state, dispatch } = useGame();
  const t = translations[state.lang as keyof typeof translations] || translations.en;
  
  const points = state.turnPoints;
  const isCorrect = points > 0;

  React.useEffect(() => {
    if (isCorrect) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8b5cf6', '#ec4899', '#10b981', '#fbbf24']
      });
    }
  }, [isCorrect]);

  const handleNext = () => {
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
        <div className="song-info-card w-full max-w-sm fade-in drop-shadow" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', borderRadius: '12px', background: 'var(--card)', border: '1px solid var(--border)' }}>
          {state.currentSong.artworkUrl && (
            <img src={state.currentSong.artworkUrl} alt="Album Art" style={{ width: 60, height: 60, borderRadius: '8px', objectFit: 'cover' }} />
          )}
          <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
            <span style={{ fontWeight: 800, fontSize: '1.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {state.currentSong.title}
            </span>
            <span className="text-muted" style={{ fontWeight: 600, fontSize: '0.9rem' }}>{state.currentSong.artist}</span>
            <span className="text-muted" style={{ fontSize: '0.8rem' }}>{state.currentSong.year}</span>
          </div>
        </div>
      )}
      
      <div className="score-badge mt-2 w-full max-w-sm" style={{ padding: '0.75rem 1rem', alignItems: 'stretch' }}>
        <h2 className="text-center mb-2 m-0" style={{ fontSize: '1.25rem' }}>Total: +{points} Points</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '0.95rem' }}>
            <span>Song Title:</span>
            <span className={state.turnResults?.title > 0 ? 'text-success' : 'text-danger'} style={{ fontWeight: 800 }}>+{state.turnResults?.title || 0}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '0.95rem' }}>
            <span>Artist:</span>
            <span className={state.turnResults?.artist > 0 ? 'text-success' : 'text-danger'} style={{ fontWeight: 800 }}>+{state.turnResults?.artist || 0}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '0.95rem' }}>
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
    </div>
  );
};
