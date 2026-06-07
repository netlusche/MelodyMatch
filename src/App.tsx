import React from 'react';
import { GameProvider, useGame } from './state/GameContext';
import { SetupScreen } from './components/SetupScreen';
import { PassDeviceScreen } from './components/PassDeviceScreen';
import { TurnResultScreen } from './components/TurnResultScreen';
import { FinalResultsScreen } from './components/FinalResultsScreen';
import { QuizScreen } from './components/QuizScreen';
import { GenreScreen } from './components/GenreScreen';
import { translations } from './i18n/translations';

import { audioManager } from './services/audio';

const MainContent: React.FC = () => {
  const { state } = useGame();

  switch (state.phase) {
    case 'SETUP':
      return <SetupScreen />;
    case 'GENRE_SELECTION':
      return <GenreScreen />;
    case 'PASS_DEVICE':
      return <PassDeviceScreen />;
    case 'QUIZ':
      return <QuizScreen />;
    case 'TURN_RESULT':
      return <TurnResultScreen />;
    case 'FINAL_RESULTS':
      return <FinalResultsScreen />;
    default:
      return <SetupScreen />;
  }
};

const MainApp: React.FC = () => {
  const { state, dispatch } = useGame();
  const t = translations[state.lang as keyof typeof translations] || translations.en;

  React.useEffect(() => {
    audioManager.registerUnlockListeners();
  }, []);

  React.useEffect(() => {
    document.body.className = '';
    document.body.classList.add(`theme-${state.theme || 'default'}`);
  }, [state.theme]);

  React.useEffect(() => {
    if (state.phase === 'QUIZ' && state.currentSong?.previewUrl) {
      audioManager.playSong(state.currentSong.previewUrl).catch(err => {
        console.warn("Root autoplay initiation failed:", err);
      });
    } else {
      audioManager.stop();
    }
  }, [state.phase, state.currentSong]);
  
  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <MainContent />
      {state.phase !== 'SETUP' && (
        <button 
          onClick={() => dispatch({type: 'RESET_GAME'})} 
          className="start-over-btn"
        >
          {t.startOver}
        </button>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <GameProvider>
      <MainApp />
    </GameProvider>
  );
};

export default App;
