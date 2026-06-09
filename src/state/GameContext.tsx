import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { GameState } from '../types';
import { gameReducer, initialState, GameAction } from './gameReducer';
import { loadGameState, saveGameState } from '../services/storage';

interface GameContextProps {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const GameContext = createContext<GameContextProps | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, loadGameState() || initialState);

  useEffect(() => {
    const timer = setTimeout(() => saveGameState(state), 300);
    return () => clearTimeout(timer);
  }, [state]);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
