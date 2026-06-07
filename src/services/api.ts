import { Song } from '../types';
import { normalizeString } from '../utils/stringUtils';

const SEARCH_TERMS = ['pop', 'rock', 'party', '90s', '2000s hits', 'dance', 'chart hits'];

const fetchWithTimeout = async (url: string, options = {}, timeout = 8000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

/**
 * Fetches the exact release year of a track on-the-fly.
 */
export const fetchTrackYear = async (trackId: number): Promise<string> => {
  try {
    const res = await fetchWithTimeout(`https://api.deezer.com/track/${trackId}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.release_date) {
        return new Date(data.release_date).getFullYear().toString();
      }
    }
  } catch (e) {
    console.error(`Failed to fetch track details for ID ${trackId}:`, e);
  }
  // Return current year as a safe fallback if fetch fails
  return new Date().getFullYear().toString();
};

export const fetchSongs = async (count: number, genres: string[] = ['all']): Promise<Song[]> => {
  try {
    let termsToSearch: string[] = [];
    
    if (genres.includes('all') || genres.length === 0) {
      termsToSearch = [SEARCH_TERMS[Math.floor(Math.random() * SEARCH_TERMS.length)]];
    } else {
      termsToSearch = genres;
    }

    const resultsArray = [];
    for (const term of termsToSearch) {
      try {
        // Map specific search terms to improve search quality on Deezer
        let query = term;
        if (term === 'ndw') {
          query = 'neue deutsche welle';
        } else if (term === 'deutscher rap') {
          query = 'deutscher rap';
        }
        
        const limit = 100; // Limit per search term query
        const url = `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=${limit}`;
        const res = await fetchWithTimeout(url);
        
        if (res.ok) {
          const data = await res.json();
          resultsArray.push(data.data || []);
        }
      } catch (e) {
        console.error("Fetch failed for term", term, e);
      }
    }

    const allResults = resultsArray.flat();
    
    // Filter out invalid items and deduplicate tracks using normalized string keys
    const uniqueKeys = new Set();
    const validTracks = allResults.filter((t: any) => {
      if (!t.preview || !t.title || !t.artist || !t.artist.name || !t.album || !t.album.cover_big) return false;
      
      const matchKey = `${normalizeString(t.title)}-${normalizeString(t.artist.name)}`;
      if (uniqueKeys.has(matchKey)) return false;
      
      uniqueKeys.add(matchKey);
      return true;
    });
    
    // Shuffle the tracks
    const shuffled = validTracks.sort(() => 0.5 - Math.random());
    
    // Map to our Song type
    return shuffled.slice(0, count).map((t: any) => ({
      id: t.id,
      title: t.title,
      artist: t.artist.name,
      // Left blank during pool fetch, will be loaded on-the-fly when round starts
      year: '', 
      previewUrl: t.preview,
      artworkUrl: t.album.cover_big,
    }));
  } catch (error) {
    console.error("Failed to fetch songs from Deezer:", error);
    return [];
  }
};
