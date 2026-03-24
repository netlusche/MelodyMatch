import React, { useState } from 'react';
import { useGame } from '../state/GameContext';
import { translations } from '../i18n/translations';
import { fetchSongs } from '../services/api';
import { Music, Play, Loader2 } from 'lucide-react';

const BASE_GENRES = [
  { id: 'pop', label: 'Pop' },
  { id: 'rock', label: 'Rock' },
  { id: 'indie', label: 'Indie' },
  { id: 'hip-hop', label: 'Hip-Hop' },
  { id: 'electronic', label: 'Electronic' },
  { id: 'r&b', label: 'R&B' },
  { id: 'alternative', label: 'Alternative' },
  { id: 'classic rock', label: 'Classic Rock' },
  { id: 'heavy metal', label: 'Heavy Metal' }
];

const DE_EXTRAS = [
  { id: 'schlager', label: 'Schlager' },
  { id: 'neue deutsche welle', label: 'Neue Deutsche Welle' },
  { id: 'deutschpop', label: 'Deutschpop' },
  { id: 'deutschrock', label: 'Deutschrock' },
  { id: 'deutscher rap', label: 'Deutscher Hiphop / Rap' },
  { id: 'ballermann', label: 'Ballermann' },
  { id: 'partyhits', label: 'Partyhits' }
];

export const GenreScreen: React.FC = () => {
  const { state, dispatch } = useGame();
  const t = translations[state.lang as keyof typeof translations] || translations.en;
  
  const availableGenres = state.lang === 'de'
    ? [{ id: 'all', label: 'Alle Genres' }, ...BASE_GENRES, ...DE_EXTRAS]
    : [{ id: 'all', label: 'All Genres' }, ...BASE_GENRES];

  const [selectedGenres, setSelectedGenres] = useState<string[]>(state.genres || ['all']);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenreToggle = (id: string) => {
    if (id === 'all') {
      setSelectedGenres(['all']);
      return;
    }
    let newSelection = selectedGenres.filter(g => g !== 'all');
    if (newSelection.includes(id)) {
      newSelection = newSelection.filter(g => g !== id);
    } else {
      newSelection.push(id);
    }
    if (newSelection.length === 0) {
      setSelectedGenres(['all']);
    } else {
      setSelectedGenres(newSelection);
    }
  };

  const handleStart = async () => {
    setIsLoading(true);
    // Fetch a massive static pool of 100 songs regardless of round count to guarantee huge variety in wrong-answer multiple-choice generation!
    const fetchedSongs = await fetchSongs(100, selectedGenres);
    
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
      
      <div className="setup-section w-full max-w-sm mt-2">
        <h2 className="section-title flex justify-between w-full">
          <span><Music className="icon" size={20} /> {t.setupSelection}</span>
        </h2>
        <p className="text-muted mb-3" style={{ fontSize: '0.85rem', marginTop: '-0.25rem', lineHeight: '1.2' }}>{t.genreHelper}</p>
        
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
        <button className="option-button primary large w-full" onClick={handleStart} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="icon" size={20} style={{ animation: 'spin 2s linear infinite' }} />
          ) : (
            <Play className="icon" size={20} />
          )} 
          <span style={{ marginLeft: '0.5rem' }}>{isLoading ? 'Loading...' : t.start}</span>
        </button>
      </div>
    </div>
  );
};
