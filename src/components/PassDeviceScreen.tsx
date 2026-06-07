import React, { useState } from 'react';
import { useGame } from '../state/GameContext';
import { translations } from '../i18n/translations';
import { Smartphone, Play, Loader2 } from 'lucide-react';
import { normalizeString } from '../utils/stringUtils';
import { audioManager } from '../services/audio';
import { fetchTrackYear } from '../services/api';

export const PassDeviceScreen: React.FC = () => {
  const { state, dispatch } = useGame();
  const t = translations[state.lang as keyof typeof translations] || translations.en;
  const currentPlayer = state.players[state.currentPlayerIndex];
  const [isBeginning, setIsBeginning] = useState(false);

  const handleBeginTurn = () => {
    if (isBeginning) return;
    setIsBeginning(true);

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

    // 1. Create a promise that resolves after 4 seconds
    const delayPromise = new Promise(resolve => setTimeout(resolve, 4000));

    // 2. Fetch the correct release year in the background, with a strict 4-second timeout
    let yearPromise: Promise<string>;
    if (randomSong.id && randomSong.id !== 1) {
      const timeoutPromise = new Promise<string>((_, reject) => 
        setTimeout(() => reject(new Error("Year fetch timeout")), 4000)
      );
      yearPromise = Promise.race([
        fetchTrackYear(randomSong.id, randomSong.title, randomSong.artist),
        timeoutPromise
      ]).catch(() => new Date().getFullYear().toString());
    } else {
      yearPromise = Promise.resolve(randomSong.year || '2023');
    }

    // 3. Wait for both the minimum 2-second delay and year fetch to complete
    Promise.all([delayPromise, yearPromise]).then(([_, year]) => {
      dispatch({ 
        type: 'BEGIN_TURN', 
        payload: { song: { ...randomSong, year } } 
      });
    });
  };

  if (!currentPlayer) return null;

  if (isBeginning) {
    const getLoadingText = () => {
      const isDe = state.lang === 'de';
      switch (state.theme) {
        case 'matrix':
          return isDe ? 'Simulation wird initialisiert...' : 'Initializing simulation...';
        case 'sakura':
          return isDe ? 'Blütenblätter werden gesammelt...' : 'Gathering cherry blossoms...';
        case 'westeros':
          return isDe ? 'Funken werden entzündet...' : 'Igniting flames...';
        case 'vaporwave':
          return isDe ? 'Wellen werden synthetisiert...' : 'Synthesizing wave...';
        case 'default':
        default:
          return isDe ? 'Party-Tracks werden geladen...' : 'Loading party tracks...';
      }
    };

    return (
      <div className="screen center-content fade-in" style={{ justifyContent: 'center', minHeight: '80vh' }}>
        <div className="music-player-ui primary-glow" style={{ padding: '2rem', borderRadius: '50%', background: 'var(--card)', display: 'inline-flex', marginBottom: '1.5rem' }}>
          <Loader2 size={64} className="loading-spinner" />
        </div>
        <h2 className="title-gradient text-center" style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, paddingInline: '1rem' }}>
          {getLoadingText()}
        </h2>
      </div>
    );
  }

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
        <button 
          className="option-button primary large w-full pulse-animation" 
          onClick={handleBeginTurn}
          disabled={isBeginning}
        >
          <Play fill="currentColor" size={24} />
          <span>{t.beginTurn}</span>
        </button>
      </div>
    </div>
  );
};
