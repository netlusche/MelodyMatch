import React from 'react';
import { useGame } from '../state/GameContext';
import { translations } from '../i18n/translations';
import { Smartphone, Play } from 'lucide-react';
import { normalizeString } from '../utils/stringUtils';
import { audioManager } from '../services/audio';
import { fetchTrackYear } from '../services/api';

export const PassDeviceScreen: React.FC = () => {
  const { state, dispatch } = useGame();
  const t = translations[state.lang as keyof typeof translations] || translations.en;
  const currentPlayer = state.players[state.currentPlayerIndex];

  const handleBeginTurn = () => {
    const playedKeys = new Set(
      state.history.map((s: any) => `${normalizeString(s.title)}-${normalizeString(s.artist)}`)
    );
    
    const availablePool = state.songPool.filter((s: any) => {
      const isPlayedId = state.history.some((h: any) => h.id === s.id);
      const songKey = `${normalizeString(s.title)}-${normalizeString(s.artist)}`;
      return !isPlayedId && !playedKeys.has(songKey);
    });

    const poolToUse = availablePool.length > 0 ? availablePool : state.songPool;

    const randomSong = poolToUse.length > 0 
      ? poolToUse[Math.floor(Math.random() * poolToUse.length)]
      : { id: 1, title: 'Demo Song', artist: 'Demo Artist', year: '2023', previewUrl: '', artworkUrl: '' };

    // Play the song immediately and synchronously inside the user gesture handler
    // to preserve the gesture token for iOS Safari.
    if (randomSong.previewUrl) {
      audioManager.playSong(randomSong.previewUrl).catch(err => {
        console.warn("Autoplay initiation failed on user gesture:", err);
      });
    }
      
    // Fetch the correct release year in the background, then transition the phase
    if (randomSong.id && randomSong.id !== 1) {
      fetchTrackYear(randomSong.id).then((year) => {
        dispatch({ 
          type: 'BEGIN_TURN', 
          payload: { song: { ...randomSong, year } } 
        });
      }).catch(() => {
        dispatch({ 
          type: 'BEGIN_TURN', 
          payload: { song: { ...randomSong, year: new Date().getFullYear().toString() } } 
        });
      });
    } else {
      dispatch({ 
        type: 'BEGIN_TURN', 
        payload: { song: randomSong } 
      });
    }
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
