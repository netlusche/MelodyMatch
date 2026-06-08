import React, { useMemo, useState } from 'react';
import { useGame } from '../state/GameContext';
import { translations } from '../i18n/translations';
import { QuestionStep } from '../types';
import { Disc, PlayCircle, PauseCircle } from 'lucide-react';
import { normalizeString } from '../utils/stringUtils';
import { shuffleArray } from '../utils/arrayUtils';
import { audioManager } from '../services/audio';

// Generates 3 random wrong answers
const getOptions = (correct: string, pool: any[], field: string) => {
  const normalizedCorrect = normalizeString(correct);
  const uniqueOthers = new Map<string, string>();
  
  if (field === 'year') {
    const correctYear = parseInt(correct, 10) || new Date().getFullYear();
    const currentYear = new Date().getFullYear();
    
    // Generate years from 1970 to currentYear, ensuring they are at least 3 years apart
    const generatedYears: number[] = [];
    let attempts = 0;
    while (generatedYears.length < 3 && attempts < 100) {
      attempts++;
      const randomYear = Math.floor(Math.random() * (currentYear - 1970 + 1)) + 1970;
      
      // Check if it's at least 3 years apart from correctYear
      if (Math.abs(randomYear - correctYear) < 3) continue;
      
      // Check if it's at least 3 years apart from already generated years
      const isTooClose = generatedYears.some(y => Math.abs(y - randomYear) < 3);
      if (isTooClose) continue;
      
      generatedYears.push(randomYear);
    }
    
    // Fallback if we failed to generate spaced years
    while (generatedYears.length < 3) {
      const fallbackYear = correctYear + (generatedYears.length + 1) * 5;
      if (!generatedYears.includes(fallbackYear)) {
        generatedYears.push(fallbackYear);
      }
    }
    
    const selected = generatedYears.map(y => y.toString());
    selected.push(correct);
    return selected.sort(() => 0.5 - Math.random());
  }

  for (const s of pool) {
    const rawVal = s[field];
    if (!rawVal) continue;
    const norm = normalizeString(rawVal);
    if (norm !== normalizedCorrect && !uniqueOthers.has(norm)) {
      uniqueOthers.set(norm, rawVal);
    }
  }

  const others = Array.from(uniqueOthers.values());
  
  // fallback if pool is too small
  while (others.length < 3) {
    const fallback = `Random Choice ${Math.floor(Math.random() * 1000)}`;
    const norm = normalizeString(fallback);
    if (norm !== normalizedCorrect && !uniqueOthers.has(norm)) {
      others.push(fallback);
      uniqueOthers.set(norm, fallback);
    }
  }
  
  // shuffle others, take 3
  const shuffledOthers = shuffleArray(others);
  const selected = shuffledOthers.slice(0, 3);
  selected.push(correct);
  // shuffle all 4
  return shuffleArray(selected);
};

export const QuizScreen: React.FC = () => {
  const { state, dispatch } = useGame();
  const t = translations[state.lang as keyof typeof translations] || translations.en;
  
  const song = state.currentSong;
  const step = state.currentStep;
  
  const [isPlaying, setIsPlaying] = useState(!audioManager.getAudio().paused);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Reset transitioning state when the active step changes
  React.useEffect(() => {
    setIsTransitioning(false);
  }, [step]);

  // Sync state with HTML5 audio events (play, pause, ended)
  React.useEffect(() => {
    const audio = audioManager.getAudio();
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    // Sync state immediately and after a small delay to handle autoplay activation timing
    setIsPlaying(!audio.paused);
    const syncTimer = setTimeout(() => {
      setIsPlaying(!audio.paused);
    }, 150);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      clearTimeout(syncTimer);
    };
  }, []);

  const toggleAudio = () => {
    if (isPlaying) {
      audioManager.pause();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      const audio = audioManager.getAudio();
      audio.play()
        .then(() => setIsPlaying(true))
        .catch(err => {
          console.warn("Manual play failed:", err);
          setIsPlaying(false);
        });
    }
  };

  const options = useMemo(() => {
    if (!song) return [];
    const fieldMap: Record<QuestionStep, 'title' | 'artist' | 'year'> = {
      TITLE: 'title',
      ARTIST: 'artist',
      YEAR: 'year'
    };
    return getOptions(song[fieldMap[step]], state.songPool, fieldMap[step]);
  }, [song, step, state.songPool]);

  const getQuestionText = () => {
    switch (step) {
      case 'TITLE': return t.whatTitle || 'What is the title?';
      case 'ARTIST': return t.whoIsArtist || 'Who is the artist?';
      case 'YEAR': return t.whatYear || 'Release year?';
      default: return '';
    }
  };

  const handleAnswer = (choice: string) => {
    if (isTransitioning || !song) return;
    setIsTransitioning(true);

    const fieldMap: Record<QuestionStep, 'title' | 'artist' | 'year'> = {
      TITLE: 'title',
      ARTIST: 'artist',
      YEAR: 'year'
    };
    
    const isCorrect = choice === song[fieldMap[step]];
    const stepPointsMap: Record<QuestionStep, number> = { TITLE: 10, ARTIST: 5, YEAR: 5 };
    const points = isCorrect ? stepPointsMap[step] : 0;
    
    if (step === 'TITLE') {
      dispatch({ type: 'ANSWER_STEP', payload: { correct: isCorrect, points } });
      dispatch({ type: 'NEXT_STEP', payload: { step: 'ARTIST' } });
    } else if (step === 'ARTIST') {
      dispatch({ type: 'ANSWER_STEP', payload: { correct: isCorrect, points } });
      dispatch({ type: 'NEXT_STEP', payload: { step: 'YEAR' } });
    } else {
      // It was YEAR, so end turn
      dispatch({ type: 'END_TURN', payload: { isCorrect, points } });
    }
  };

  if (!song) return <div className="screen center-content">No song found.</div>;

  return (
    <div className="screen center-content fade-in">
      <div className="text-muted mb-2 text-center text-sm font-bold glow-text w-full" style={{ fontSize: '1.1rem', marginTop: '-1rem' }}>
        {t.round} {state.currentRound} / {state.totalRounds}
      </div>
      {/* Audio Element is managed globally by AudioManager */}
      
      <div className="music-player-ui primary-glow mb-6" style={{ padding: '0.5rem', borderRadius: '50%', background: 'var(--card)' }}>
        {song.artworkUrl ? (
          <img 
            src={song.artworkUrl} 
            alt="Album Art" 
            className={`icon ${isPlaying ? 'pulse-animation' : ''}`} 
            style={{ 
              width: 150, height: 150, borderRadius: '50%', 
              objectFit: 'cover', 
              animation: isPlaying ? 'spin 5s linear infinite' : 'none',
              filter: 'blur(12px) brightness(0.6)'
            }} 
          />
        ) : (
          <Disc size={150} className={`icon text-primary ${isPlaying ? 'pulse-animation' : ''}`} style={isPlaying ? { animation: 'spin 3s linear infinite' } : {}} />
        )}
      </div>

      <button className="option-button outline mb-6 group" onClick={toggleAudio}>
        {isPlaying ? <PauseCircle size={24} className="text-primary" /> : <PlayCircle size={24} className="text-primary" />}
        <span>{isPlaying ? 'Pause Audio' : 'Play Audio'}</span>
      </button>

      <h2 className="title-gradient gigantic text-center mb-6">{getQuestionText()}</h2>

      <div className="options-grid w-full">
        {options.map((opt, idx) => (
          <button 
            key={idx} 
            className="option-button primary large" 
            onClick={() => handleAnswer(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
      
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
