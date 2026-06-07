import React, { useMemo, useState } from 'react';
import { useGame } from '../state/GameContext';
import { translations } from '../i18n/translations';
import { QuestionStep } from '../types';
import { Disc, PlayCircle, PauseCircle } from 'lucide-react';
import { normalizeString } from '../utils/stringUtils';
import { audioManager } from '../services/audio';

// Generates 3 random wrong answers
const getOptions = (correct: string, pool: any[], field: string) => {
  const normalizedCorrect = normalizeString(correct);
  const uniqueOthers = new Map<string, string>();
  
  for (const s of pool) {
    const rawVal = s[field];
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
  others.sort(() => 0.5 - Math.random());
  const selected = others.slice(0, 3);
  selected.push(correct);
  // shuffle all 4
  return selected.sort(() => 0.5 - Math.random());
};

export const QuizScreen: React.FC = () => {
  const { state, dispatch } = useGame();
  const t = translations[state.lang as keyof typeof translations] || translations.en;
  
  const song = state.currentSong;
  const step = state.currentStep;
  
  const [isPlaying, setIsPlaying] = useState(!audioManager.getAudio().paused);

  const toggleAudio = () => {
    if (isPlaying) {
      audioManager.pause();
      setIsPlaying(false);
    } else {
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
    if (!song) return;
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
