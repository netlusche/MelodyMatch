import React, { useState } from 'react';
import { useGame } from '../state/GameContext';
import { translations } from '../i18n/translations';
import { fetchSongs } from '../services/api';
import { Music, Play, Loader2 } from 'lucide-react';

export const GenreScreen: React.FC = () => {
  const { state, dispatch } = useGame();
  const t = translations[state.lang as keyof typeof translations] || translations.en;
  
  const DECADE_GENRES = [
    { id: '50s', label: { en: '50s', de: '50er' } },
    { id: '60s', label: { en: '60s', de: '60er' } },
    { id: '70s', label: { en: '70s', de: '70er' } },
    { id: '80s', label: { en: '80s', de: '80er' } },
    { id: '90s', label: { en: '90s', de: '90er' } },
    { id: '2000+', label: { en: '2000+', de: '2000+' } }
  ];

  const BASE_GENRES = [
    { id: 'pop', label: 'Pop' },
    { id: 'rock', label: 'Rock' },
    { id: 'indie', label: 'Indie' },
    { id: 'new wave', label: 'New Wave / Post-Punk' },
    { id: 'hip-hop', label: 'Hip-Hop' },
    { id: 'electronic', label: 'Electronic' },
    { id: 'r&b', label: 'R&B' },
    { id: 'alternative', label: 'Alternative' },
    { id: 'classic rock', label: 'Classic Rock' },
    { id: 'heavy metal', label: 'Heavy Metal' }
  ];

  const DE_EXTRAS = [
    { id: 'schlager', translationKey: 'genre_schlager' },
    { id: 'ndw', translationKey: 'genre_ndw' },
    { id: 'deutschpop', translationKey: 'genre_deutschpop' },
    { id: 'deutschrock', translationKey: 'genre_deutschrock' },
    { id: 'deutscher rap', translationKey: 'genre_deutscher_rap' },
    { id: 'ballermann', translationKey: 'genre_ballermann' },
    { id: 'partyhits', translationKey: 'genre_partyhits' }
  ];

  const availableDecades = DECADE_GENRES.map(d => ({
    id: d.id,
    label: state.lang === 'de' ? d.label.de : d.label.en
  }));

  const availableGenres = [
    { id: 'all', label: 'Charts' },
    ...BASE_GENRES,
    ...DE_EXTRAS.map(g => ({
      id: g.id,
      label: (t as any)[g.translationKey] || g.id
    }))
  ];

  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  const handleGenreToggle = (id: string) => {
    let newSelection = [...selectedGenres];
    if (newSelection.includes(id)) {
      newSelection = newSelection.filter(g => g !== id);
    } else {
      newSelection.push(id);
    }
    setSelectedGenres(newSelection);
  };

  const handleStart = async () => {
    if (selectedGenres.length === 0) {
      setShowAlert(true);
      return;
    }
    setIsLoading(true);
    // Size the song pool dynamically based on game configuration, with a safe buffer and a minimum of 100 songs
    const neededSongsCount = Math.max(100, state.players.length * state.totalRounds + 10);
    const fetchedSongs = await fetchSongs(neededSongsCount, selectedGenres);
    
    if (fetchedSongs.length > 0) {
      dispatch({ type: 'SET_SONG_POOL', payload: { songs: fetchedSongs } });
    }
    
    dispatch({
      type: 'START_GAME',
      payload: { genres: selectedGenres }
    });
    setIsLoading(false);
  };

  return (
    <div className="screen setup-screen fade-in">
      <h1 className="title-gradient gigantic text-center mb-2">{t.setupGenres}</h1>
      
      <div className="setup-section w-full max-w-sm mt-2" style={{ maxHeight: 'calc(100vh - 240px)', overflowY: 'auto', paddingRight: '0.25rem' }}>
        <p className="text-muted mb-3" style={{ fontSize: '0.85rem', marginTop: '-0.25rem', lineHeight: '1.2' }}>{t.genreHelper}</p>

        <h2 className="section-title flex justify-between w-full" style={{ marginBottom: '0.5rem', fontSize: '1.05rem', borderBottom: '1px solid var(--border)' }}>
          <span><Music className="icon" size={18} /> {state.lang === 'de' ? 'Jahrzehnte' : 'Decades'}</span>
        </h2>
        <div className="options-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {availableDecades.map(d => (
            <button 
              key={d.id}
              className={`option-button ${selectedGenres.includes(d.id) ? 'active' : 'outline'}`}
              style={{ padding: '0.5rem', minHeight: '44px', fontSize: '0.9rem' }}
              onClick={() => handleGenreToggle(d.id)}
            >
              {d.label}
            </button>
          ))}
        </div>

        <h2 className="section-title flex justify-between w-full" style={{ marginBottom: '0.5rem', fontSize: '1.05rem', borderBottom: '1px solid var(--border)' }}>
          <span><Music className="icon" size={18} /> {state.lang === 'de' ? 'Musik-Genres' : 'Music Genres'}</span>
        </h2>
        <div className="options-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5rem' }}>
          {availableGenres.map(g => (
            <button 
              key={g.id}
              className={`option-button ${selectedGenres.includes(g.id) ? 'active' : 'outline'}`}
              style={{ padding: '0.5rem', minHeight: '44px', fontSize: '0.9rem' }}
              onClick={() => handleGenreToggle(g.id)}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full max-w-sm mt-4">
        <button 
          className={`option-button primary large w-full ${selectedGenres.length === 0 ? 'visually-disabled' : ''}`} 
          onClick={handleStart} 
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="icon" size={20} style={{ animation: 'spin 2s linear infinite' }} />
          ) : (
            <Play className="icon" size={20} />
          )} 
          <span style={{ marginLeft: '0.5rem' }}>{isLoading ? 'Loading...' : t.start}</span>
        </button>
      </div>

      {showAlert && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '1.5rem',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: 'var(--card)',
            border: '2px solid var(--border-hover)',
            borderRadius: '16px',
            padding: '1.5rem',
            maxWidth: '320px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            animation: 'scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--danger)', fontSize: '1.25rem', fontWeight: 800 }}>
              {state.lang === 'de' ? 'Hinweis' : 'Notice'}
            </h3>
            <p className="text-muted" style={{ margin: '0 0 1.25rem 0', fontSize: '0.95rem', lineHeight: '1.4' }}>
              {state.lang === 'de' 
                ? 'Bitte wähle mindestens ein Genre oder Jahrzehnt aus, bevor du das Spiel startest.' 
                : 'Please select at least one genre or decade before starting the game.'}
            </p>
            <button 
              className="option-button primary w-full"
              style={{ minHeight: '44px', fontSize: '0.95rem' }}
              onClick={() => setShowAlert(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
