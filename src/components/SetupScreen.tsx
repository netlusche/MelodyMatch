import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../state/GameContext';
import { Player, Language, Theme, Song } from '../types';
import { Users, Settings, Globe, ChevronRight, UserPlus, Trash2, Heart, Play, Square, ChevronDown, ChevronUp } from 'lucide-react';
import { translations } from '../i18n/translations';
import { getFavorites, removeFavorite } from '../utils/favorites';

export const SetupScreen: React.FC = () => {
  const { state, dispatch } = useGame();
  const [lang, setLang] = useState<Language>(state.lang);
  const [rounds, setRounds] = useState<number>(state.totalRounds || 10);
  const [players, setPlayers] = useState<Player[]>(
    state.players.length > 0 ? state.players : [
      { id: '1', name: 'Player 1', score: 0 }
    ]
  );

  const [showFavorites, setShowFavorites] = useState(false);
  const [favoritesList, setFavoritesList] = useState<Song[]>([]);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const t = translations[lang];

  // Load favorites when screen mounts or when toggled
  useEffect(() => {
    setFavoritesList(getFavorites());
  }, [showFavorites]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setThemeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const filledPlayers = players.map((p, idx) => ({ ...p, name: p.name.trim() || `Player ${idx + 1}` }));
    dispatch({
      type: 'CONTINUE_TO_GENRES',
      payload: { players: filledPlayers, totalRounds: rounds, lang }
    });
  };

  const handleTogglePlay = (song: Song) => {
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

  const handleRemoveFavorite = (id: number) => {
    removeFavorite(id);
    setFavoritesList(getFavorites());
    if (playingId === id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingId(null);
    }
  };

  const handleClearFavorites = () => {
    localStorage.removeItem('melody-match-favorites');
    setFavoritesList([]);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setPlayingId(null);
  };

  return (
    <div className="screen setup-screen">
      <div className="flex justify-between items-center w-full" style={{ marginBottom: '0.5rem' }}>
        <h1 className="title-gradient" style={{ margin: 0 }}>{t.title}</h1>
        <div className="theme-select-container" ref={dropdownRef} style={{ position: 'relative' }}>
          <button 
            type="button"
            className="theme-dropdown-trigger"
            onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              padding: '0.4rem 0.8rem',
              borderRadius: '10px',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
              fontFamily: 'inherit',
              transition: 'all 0.2s ease',
            }}
          >
            <span>
              {state.theme === 'plain_white' && 'Plain White'}
              {state.theme === 'plain_dark' && 'Plain Dark'}
              {state.theme === 'matrix' && 'Matrix'}
              {state.theme === 'vaporwave' && 'Vaporwave'}
              {state.theme === 'westeros' && 'Westeros'}
              {state.theme === 'sakura' && 'Sakura'}
              {state.theme === 'lcars' && 'LCARS'}
              {state.theme === 'frutiger_aero' && 'Frutiger Aero'}
              {state.theme === 'synthwave' && 'Synthwave'}
              {state.theme === 'heavy_metal' && 'Heavy Metal'}
              {state.theme === 'post_punk' && 'Post Punk'}
              {state.theme === 'rock_legends' && 'Rock Legends'}
              {state.theme === 'kraftwerk' && 'Kraftwerk'}
              {(state.theme === 'default' || !state.theme) && 'Default'}
            </span>
            {themeDropdownOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          
          {themeDropdownOpen && (
            <div 
              className="theme-dropdown-menu"
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '6px',
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.3), 0 0 0 1px var(--border)',
                zIndex: 1000,
                width: '150px',
                maxHeight: '180px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                padding: '4px',
                gap: '2px'
              }}
            >
              {[
                { value: 'default', label: 'Default' },
                { value: 'plain_white', label: 'Plain White' },
                { value: 'plain_dark', label: 'Plain Dark' },
                { value: 'matrix', label: 'Matrix' },
                { value: 'vaporwave', label: 'Vaporwave' },
                { value: 'westeros', label: 'Westeros' },
                { value: 'sakura', label: 'Sakura' },
                { value: 'lcars', label: 'LCARS' },
                { value: 'frutiger_aero', label: 'Frutiger Aero' },
                { value: 'synthwave', label: 'Synthwave' },
                { value: 'heavy_metal', label: 'Heavy Metal' },
                { value: 'post_punk', label: 'Post Punk' },
                { value: 'rock_legends', label: 'Rock Legends' },
                { value: 'kraftwerk', label: 'Kraftwerk' }
              ].map(t => {
                const isActive = state.theme === t.value || (!state.theme && t.value === 'default');
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => {
                      dispatch({ type: 'SET_THEME', payload: { theme: t.value as Theme } });
                      setThemeDropdownOpen(false);
                    }}
                    className={`theme-dropdown-item ${isActive ? 'active' : ''}`}
                    style={{
                      background: isActive ? 'var(--primary)' : 'transparent',
                      border: 'none',
                      borderRadius: '8px',
                      color: isActive ? '#fff' : 'var(--text)',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      outline: 'none'
                    }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          )}
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

      {/* Persistent Favorites Accordion Section */}
      <div className="setup-section favorites-accordion">
        <button 
          className="option-button outline w-full justify-between" 
          onClick={() => setShowFavorites(!showFavorites)}
          style={{ borderStyle: 'solid', display: 'flex', alignItems: 'center' }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Heart size={18} fill="currentColor" className="text-danger" />
            <span>{t.favorites}</span>
            {favoritesList.length > 0 && <span className="favorites-badge">{favoritesList.length}</span>}
          </span>
          {showFavorites ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {showFavorites && (
          <div className="favorites-drawer fade-in">
            {favoritesList.length === 0 ? (
              <p className="text-center text-muted" style={{ padding: '1rem', fontSize: '0.9rem' }}>
                {t.noFavorites}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button 
                  className="option-button danger outline sm"
                  style={{ alignSelf: 'flex-end', fontSize: '0.8rem', padding: '0.25rem 0.75rem', minHeight: '32px' }}
                  onClick={handleClearFavorites}
                >
                  {t.clearFavorites}
                </button>
                <div className="favorites-list-container">
                  {favoritesList.map(song => (
                    <div key={song.id} className="fav-item-row">
                      <div className="fav-item-info">
                        <div className="fav-item-title">{song.title}</div>
                        <div className="fav-item-details">{song.artist} ({song.year})</div>
                      </div>
                      <div className="fav-item-actions">
                        <button 
                          className="fav-action-btn play" 
                          onClick={() => handleTogglePlay(song)}
                          title="Preview"
                        >
                          {playingId === song.id ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                        </button>
                        <a 
                          href={`https://www.deezer.com/search/${encodeURIComponent(song.artist + ' ' + song.title)}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="fav-action-btn search-deezer"
                          title="Deezer"
                        >
                          D
                        </a>
                        <a 
                          href={`https://music.apple.com/search?term=${encodeURIComponent(song.artist + ' ' + song.title)}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="fav-action-btn search-itunes"
                          title="iTunes"
                        >
                          
                        </a>
                        <button 
                          className="fav-action-btn delete" 
                          onClick={() => handleRemoveFavorite(song.id)}
                          title="Remove"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <button className="option-button primary large mt-4 group" onClick={handleNext}>
        <span>{t.next}</span>
        <ChevronRight size={24} className="group-hover-translate icon" />
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: '2rem', color: 'var(--text-muted)', width: '100%', borderTop: '1px solid var(--border)', paddingTop: '1rem', fontSize: '0.75rem', opacity: 0.6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '2px', display: 'inline-block', verticalAlign: 'middle' }}>
            <path d="M4 10v10M9 6v14M14 12v8M19 8v12" />
          </svg>
          <span>Deezer API</span>
          <span style={{ marginInline: '0.2rem' }}>&</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '2px', display: 'inline-block', verticalAlign: 'middle' }}>
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
          <span>iTunes API</span>
        </div>
        <div>Non-commercial hobby project</div>
      </div>
    </div>
  );
};
