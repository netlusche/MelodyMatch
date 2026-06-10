import { Song } from '../types';

const STORAGE_KEY = 'melody-match-favorites';
export const FAVORITES_LIMIT = 20;

export const getFavorites = (): Song[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to load favorites', e);
    return [];
  }
};

export const addFavorite = (song: Song): { success: boolean; full: boolean } => {
  try {
    const favs = getFavorites();
    if (favs.some(s => s.id === song.id)) return { success: false, full: false };
    if (favs.length >= FAVORITES_LIMIT) return { success: false, full: true };
    favs.push(song);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
    return { success: true, full: false };
  } catch (e) {
    console.error('Failed to add favorite', e);
    return { success: false, full: false };
  }
};

export const removeFavorite = (songId: number): void => {
  try {
    const favs = getFavorites();
    const filtered = favs.filter(s => s.id !== songId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to remove favorite', e);
  }
};

export const isFavorite = (songId: number): boolean => {
  const favs = getFavorites();
  return favs.some(s => s.id === songId);
};

export const clearFavorites = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear favorites', e);
  }
};
