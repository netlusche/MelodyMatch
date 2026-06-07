import { GameState, Language, Theme, Player, Song, QuestionStep, GamePhase } from '../types';

export type GameAction =
  | { type: 'CONTINUE_TO_GENRES'; payload: { players: Player[]; totalRounds: number; lang: Language; } }
  | { type: 'START_GAME'; payload: { genres: string[] } }
  | { type: 'SET_SONG_POOL'; payload: { songs: Song[] } }
  | { type: 'BEGIN_TURN'; payload: { song: Song } }
  | { type: 'ANSWER_STEP'; payload: { correct: boolean; points: number } }
  | { type: 'NEXT_STEP'; payload: { step: QuestionStep } }
  | { type: 'END_TURN'; payload: { isCorrect: boolean; points: number } }
  | { type: 'NEXT_TURN' }
  | { type: 'PLAY_AGAIN' }
  | { type: 'RESET_GAME' }
  | { type: 'SET_THEME'; payload: { theme: Theme } };

export const initialState: GameState = {
  lang: 'en',
  theme: 'default',
  players: [],
  currentPlayerIndex: 0,
  currentRound: 1,
  totalRounds: 10,
  phase: 'SETUP',
  songPool: [],
  currentSong: null,
  currentStep: 'TITLE',
  turnPoints: 0,
  turnResults: { title: 0, artist: 0, year: 0 },
  history: [],
  genres: ['all'],
};

export const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'CONTINUE_TO_GENRES':
      return {
        ...state,
        players: action.payload.players,
        totalRounds: action.payload.totalRounds,
        lang: action.payload.lang,
        phase: 'GENRE_SELECTION',
      };
    case 'START_GAME':
      return {
        ...state,
        genres: action.payload.genres,
        currentPlayerIndex: 0,
        currentRound: 1,
        phase: 'PASS_DEVICE',
        history: [],
      };
    case 'SET_SONG_POOL':
      return {
        ...state,
        songPool: action.payload.songs,
      };
    case 'BEGIN_TURN':
      return {
        ...state,
        phase: 'QUIZ',
        currentSong: action.payload.song,
        currentStep: 'TITLE',
        turnPoints: 0,
        turnResults: { title: 0, artist: 0, year: 0 },
      };
    case 'ANSWER_STEP': {
      const field = state.currentStep.toLowerCase() as 'title' | 'artist' | 'year';
      return {
        ...state,
        turnPoints: state.turnPoints + action.payload.points,
        turnResults: {
          ...state.turnResults,
          [field]: action.payload.points,
        }
      };
    }
    case 'NEXT_STEP':
      return {
        ...state,
        currentStep: action.payload.step,
      };
    case 'END_TURN': {
      const field = state.currentStep.toLowerCase() as 'title' | 'artist' | 'year';
      const finalTurnPoints = state.turnPoints + action.payload.points;
      const updatedPlayers = state.players.map((p, i) => {
        if (i === state.currentPlayerIndex) {
          return { ...p, score: p.score + finalTurnPoints };
        }
        return p;
      });
      return {
        ...state,
        phase: 'TURN_RESULT',
        players: updatedPlayers,
        turnPoints: finalTurnPoints,
        turnResults: {
          ...state.turnResults,
          [field]: action.payload.points,
        },
        history: state.currentSong ? [...state.history, state.currentSong] : state.history,
      };
    }
    case 'NEXT_TURN': {
      let nextPlayerIndex = state.currentPlayerIndex + 1;
      let nextRound = state.currentRound;
      let nextPhase: GamePhase = 'PASS_DEVICE';

      if (nextPlayerIndex >= state.players.length) {
        nextPlayerIndex = 0;
        nextRound++;
      }

      if (nextRound > state.totalRounds) {
        nextPhase = 'FINAL_RESULTS';
      }

      return {
        ...state,
        currentPlayerIndex: nextPlayerIndex,
        currentRound: nextRound,
        phase: nextPhase,
        currentSong: null,
        turnPoints: 0,
      };
    }
    case 'PLAY_AGAIN':
      return {
        ...state,
        currentPlayerIndex: 0,
        currentRound: 1,
        phase: 'SETUP',
        players: state.players.map((p) => ({ ...p, score: 0 })),
        history: [],
      };
    case 'RESET_GAME':
      return {
        ...initialState,
        theme: state.theme,
      };
    case 'SET_THEME':
      return {
        ...state,
        theme: action.payload.theme,
      };
    default:
      return state;
  }
};
