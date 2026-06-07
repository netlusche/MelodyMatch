import React, { useState } from 'react';
import { useGame } from '../state/GameContext';
import { Player, Language, Theme } from '../types';
import { Users, Settings, Globe, ChevronRight, UserPlus, Trash2 } from 'lucide-react';
import { translations } from '../i18n/translations';

export const SetupScreen: React.FC = () => {
  const { state, dispatch } = useGame();
  const [lang, setLang] = useState<Language>(state.lang);
  const [rounds, setRounds] = useState<number>(state.totalRounds || 10);
  const [players, setPlayers] = useState<Player[]>(
    state.players.length > 0 ? state.players : [
      { id: '1', name: 'Player 1', score: 0 }
    ]
  );

  const t = translations[lang];

  const handleAddPlayer = () => {
    if (players.length < 6) {
      setPlayers([...players, { id: Date.now().toString(), name: `Player ${players.length + 1}`, score: 0 }]);
    }
  };

  const handleRemovePlayer = (id: string) => {
    if (players.length > 1) {
      setPlayers(players.filter(p => p.id !== id));
    }
  };

  const handleNameChange = (id: string, name: string) => {
    setPlayers(players.map(p => p.id === id ? { ...p, name } : p));
  };

  const handleNext = () => {
    const filledPlayers = players.map((p, idx) => ({ ...p, name: p.name.trim() || `Player ${idx + 1}` }));
    dispatch({
      type: 'CONTINUE_TO_GENRES',
      payload: { players: filledPlayers, totalRounds: rounds, lang }
    });
  };

  return (
    <div className="screen setup-screen">
      <div className="flex justify-between items-center w-full" style={{ marginBottom: '0.5rem' }}>
        <h1 className="title-gradient" style={{ margin: 0 }}>{t.title}</h1>
        <div className="theme-select-container">
          <select 
            value={state.theme || 'default'} 
            onChange={(e) => dispatch({ type: 'SET_THEME', payload: { theme: e.target.value as Theme } })}
            className="theme-select"
          >
            <option value="default">Default</option>
            <option value="plain_white">Plain White</option>
            <option value="plain_dark">Plain Dark</option>
          </select>
        </div>
      </div>
      
      <div className="setup-section">
        <h2 className="section-title"><Users className="icon" /> {t.setupPlayers} (1-6)</h2>
        <div className="players-list">
          {players.map((player, index) => (
            <div key={player.id} className="player-input-row">
              <input 
                type="text" 
                value={player.name}
                onChange={(e) => handleNameChange(player.id, e.target.value)}
                onFocus={(e) => { 
                  e.target.select(); 
                  if (player.name === `Player ${index + 1}`) handleNameChange(player.id, ''); 
                }}
                onBlur={(e) => { 
                  if (!e.target.value.trim()) handleNameChange(player.id, `Player ${index + 1}`); 
                }}
                className="custom-input"
                placeholder={`${t.player} ${index + 1}`}
              />
              {players.length > 1 && (
                <button className="icon-button danger" onClick={() => handleRemovePlayer(player.id)}>
                  <Trash2 size={20} />
                </button>
              )}
            </div>
          ))}
          {players.length < 6 && (
            <button className="option-button outline" onClick={handleAddPlayer}>
              <UserPlus size={20} /> {t.addPlayer}
            </button>
          )}
        </div>
      </div>

      <div className="setup-section">
        <h2 className="section-title"><Settings className="icon" /> {t.setupRounds}</h2>
        <div className="options-grid horizontal">
          {[5, 10, 15, 20].map(r => (
            <button 
              key={r}
              className={`option-button ${rounds === r ? 'active' : ''}`}
              onClick={() => setRounds(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="setup-section">
        <h2 className="section-title"><Globe className="icon" /> {t.setupLanguage}</h2>
        <div className="options-grid horizontal">
          <button className={`option-button ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>EN</button>
          <button className={`option-button ${lang === 'de' ? 'active' : ''}`} onClick={() => setLang('de')}>DE</button>
        </div>
      </div>

      <button className="option-button primary large mt-4 group" onClick={handleNext}>
        <span>{t.next}</span>
        <ChevronRight size={24} className="group-hover-translate icon" />
      </button>
    </div>
  );
};
