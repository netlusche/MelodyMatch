import { Song } from '../types';

const STORAGE_KEY = 'melody-match-favorites';

export const getFavorites = (): Song[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to load favorites', e);
    return [];
  }
};

export const addFavorite = (song: Song): void => {
  try {
    const favs = getFavorites();
    if (!favs.some(s => s.id === song.id)) {
      favs.push(song);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
    }
  } catch (e) {
    console.error('Failed to add favorite', e);
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
