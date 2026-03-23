import { GameState } from '../types';
const KEY = 'melodymatch_state';
export const saveGameState = (state: GameState) => localStorage.setItem(KEY, JSON.stringify(state));
export const loadGameState = (): GameState | null => {
  const s = localStorage.getItem(KEY);
  return s ? JSON.parse(s) : null;
};