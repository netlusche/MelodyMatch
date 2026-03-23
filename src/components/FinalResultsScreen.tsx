import React from 'react';
import { useGame } from '../state/GameContext';
import { translations } from '../i18n/translations';
import { Trophy, RotateCcw, Medal } from 'lucide-react';
import confetti from 'canvas-confetti';

export const FinalResultsScreen: React.FC = () => {
  const { state, dispatch } = useGame();
  const t = translations[state.lang as keyof typeof translations] || translations.en;

  // Sort players descending by score
  const sortedPlayers = [...state.players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];

  React.useEffect(() => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#8b5cf6', '#ec4899', '#fbbf24']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#8b5cf6', '#ec4899', '#fbbf24']
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  const handlePlayAgain = () => {
    dispatch({ type: 'PLAY_AGAIN' });
  };

  return (
    <div className="screen final-results fade-in">
      <div className="winner-header">
        <Trophy size={80} className="icon gold-glow" />
        <h1 className="gigantic title-gradient mt-2">{t.winner}</h1>
        <h2 className="winner-name text-gold glow-text">{winner?.name}</h2>
        <div className="score-badge mt-2">
          <span className="score-value">{winner?.score}</span>
          <span className="score-label">Points</span>
        </div>
      </div>

      <div className="leaderboard mt-6">
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

      <div className="mt-8 w-full">
        <button className="option-button primary large w-full group" onClick={handlePlayAgain}>
          <RotateCcw size={24} className="group-hover-spin" />
          <span>{t.playAgain}</span>
        </button>
      </div>
    </div>
  );
};
