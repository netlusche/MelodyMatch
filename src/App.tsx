import React from 'react';
import { GameProvider, useGame } from './state/GameContext';
import { SetupScreen } from './components/SetupScreen';
import { PassDeviceScreen } from './components/PassDeviceScreen';
import { TurnResultScreen } from './components/TurnResultScreen';
import { FinalResultsScreen } from './components/FinalResultsScreen';
import { QuizScreen } from './components/QuizScreen';
import { GenreScreen } from './components/GenreScreen';
import { BackgroundEffects } from './components/BackgroundEffects';
import { translations } from './i18n/translations';

import { audioManager } from './services/audio';

import { X } from 'lucide-react';

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
  const [showGenresOverlay, setShowGenresOverlay] = React.useState(false);
  const [showStartOverConfirm, setShowStartOverConfirm] = React.useState(false);

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

  const getGenreLabel = (id: string): string => {
    const decMap: Record<string, { en: string; de: string }> = {
      '50s': { en: '50s', de: '50er' },
      '60s': { en: '60s', de: '60er' },
      '70s': { en: '70s', de: '70er' },
      '80s': { en: '80s', de: '80er' },
      '90s': { en: '90s', de: '90er' },
      '2000+': { en: '2000+', de: '2000+' },
    };
    if (decMap[id]) {
      return state.lang === 'de' ? decMap[id].de : decMap[id].en;
    }

    const baseMap: Record<string, string> = {
      'pop': 'Pop',
      'rock': 'Rock',
      'indie': 'Indie',
      'new wave': 'New Wave / Post-Punk',
      'hip-hop': 'Hip-Hop',
      'electronic': 'Electronic',
      'r&b': 'R&B',
      'alternative': 'Alternative',
      'classic rock': 'Classic Rock',
      'heavy metal': 'Heavy Metal',
      'all': 'Charts',
    };
    if (baseMap[id]) return baseMap[id];

    const deMap: Record<string, string> = {
      'schlager': t.genre_schlager,
      'ndw': t.genre_ndw,
      'deutschpop': t.genre_deutschpop,
      'deutschrock': t.genre_deutschrock,
      'deutscher rap': t.genre_deutscher_rap,
      'ballermann': t.genre_ballermann,
      'partyhits': t.genre_partyhits,
    };
    return deMap[id] || id;
  };
  
  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <BackgroundEffects />
      <MainContent />
      
      {state.phase !== 'SETUP' && (
        <button 
          onClick={() => setShowStartOverConfirm(true)} 
          className="start-over-btn"
        >
          {t.startOver}
        </button>
      )}

      {showStartOverConfirm && (
        <div className="modal-overlay" onClick={() => setShowStartOverConfirm(false)}>
          <div style={{
            background: 'var(--card)',
            border: '1.5px dashed var(--danger)',
            borderRadius: '16px',
            padding: '1.5rem',
            maxWidth: '320px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            animation: 'scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.15) forwards'
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--danger)', fontSize: '1.2rem', fontWeight: 800 }}>
              {state.lang === 'de' ? 'Willst du wirklich neu starten?' : 'Do you really want to restart?'}
            </h3>
            <p className="text-muted" style={{ margin: '0 0 1.25rem 0', fontSize: '0.9rem', lineHeight: '1.4' }}>
              {state.lang === 'de' ? 'Dein aktueller Spielstand geht dabei verloren.' : 'Your current progress will be lost.'}
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
              <button 
                type="button"
                className="option-button outline w-full"
                style={{ minHeight: '40px', fontSize: '0.9rem' }}
                onClick={() => setShowStartOverConfirm(false)}
              >
                {t.cancel}
              </button>
              <button 
                type="button"
                className="option-button danger w-full"
                style={{ minHeight: '40px', fontSize: '0.9rem' }}
                onClick={() => {
                  dispatch({type: 'RESET_GAME'});
                  setShowStartOverConfirm(false);
                }}
              >
                {t.yesStartOver}
              </button>
            </div>
          </div>
        </div>
      )}

      {state.phase !== 'SETUP' && state.phase !== 'GENRE_SELECTION' && (
        <button 
          onClick={() => setShowGenresOverlay(true)} 
          className="selected-genres-link"
        >
          {t.selectedGenresBtn}
        </button>
      )}

      {showGenresOverlay && (
        <div className="modal-overlay" onClick={() => setShowGenresOverlay(false)}>
          <div className="selected-genres-dialog" onClick={e => e.stopPropagation()}>
            <div className="selected-genres-header">
              <h3>{t.selectedGenresTitle}</h3>
              <button 
                type="button" 
                className="icon-button outline" 
                onClick={() => setShowGenresOverlay(false)}
                style={{ padding: '0.4rem', borderRadius: '50%' }}
              >
                <X size={18} />
              </button>
            </div>
            <div className="selected-genres-body">
              <div className="genres-chips-container">
                {state.genres.map(id => (
                  <span key={id} className="genre-chip">
                    {getGenreLabel(id)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
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
