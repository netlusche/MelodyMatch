import React from 'react';
import { useGame } from '../state/GameContext';
import { translations } from '../i18n/translations';
import { Smartphone, Play } from 'lucide-react';

export const PassDeviceScreen: React.FC = () => {
  const { state, dispatch } = useGame();
  const t = translations[state.lang as keyof typeof translations] || translations.en;
  const currentPlayer = state.players[state.currentPlayerIndex];

  const handleBeginTurn = () => {
    // In a full implementation, select a random song from songPool here
    const randomSong = state.songPool.length > 0 
      ? state.songPool[Math.floor(Math.random() * state.songPool.length)]
      : { id: 1, title: 'Demo Song', artist: 'Demo Artist', year: '2023', previewUrl: '', artworkUrl: '' };
      
    dispatch({ 
      type: 'BEGIN_TURN', 
      payload: { song: randomSong } 
    });
  };

  if (!currentPlayer) return null;

  return (
    <div className="screen center-content fade-in">
      <div className="text-muted text-center font-bold glow-text w-full" style={{ fontSize: '1.2rem', marginBottom: '0.5rem', marginTop: '-1rem' }}>
        {t.round} {state.currentRound} / {state.totalRounds}
      </div>
      <div className="icon-container primary-glow mb-4">
        <Smartphone size={80} className="icon active-bounce" />
      </div>
      <h2 className="subtitle">{t.passTo}</h2>
      <h1 className="title-gradient gigantic text-center">{currentPlayer.name}</h1>
      
      <div className="mt-8 w-full max-w-sm">
        <button className="option-button primary large w-full pulse-animation" onClick={handleBeginTurn}>
          <Play fill="currentColor" size={24} /> 
          <span>{t.beginTurn}</span>
        </button>
      </div>
    </div>
  );
};
