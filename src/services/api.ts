import { Song } from '../types';
import { normalizeString } from '../utils/stringUtils';

const SEARCH_TERMS = ['pop', 'rock', 'party', '90s', '2000s hits', 'dance', 'chart hits'];

/**
 * Custom JSONP fetcher for Deezer API.
 * Bypasses CORS completely directly in the client.
 */
const fetchDeezerJsonp = (url: string): Promise<any> => {
  const callbackName = 'deezer_callback_' + Math.round(100000 * Math.random());
  return new Promise((resolve, reject) => {
    const hasParams = url.includes('?');
    // Deezer uses output=jsonp to trigger JSONP response mode
    const jsonpUrl = `${url}${hasParams ? '&' : '?'}output=jsonp&callback=${callbackName}`;
    
    const script = document.createElement('script');
    script.src = jsonpUrl;
    script.async = true;
    
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error(`Deezer JSONP timed out for url: ${url}`));
    }, 8000);

    (window as any)[callbackName] = (data: any) => {
      clearTimeout(timeoutId);
      if (data && data.error) {
        reject(new Error(data.error.message || "Deezer API Error"));
      } else {
        resolve(data);
      }
      cleanup();
    };
    
    script.onerror = () => {
      clearTimeout(timeoutId);
      reject(new Error(`Deezer JSONP load failed for url: ${url}`));
      cleanup();
    };
    
    const cleanup = () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      delete (window as any)[callbackName];
    };
    
    document.body.appendChild(script);
  });
};

/**
 * Fetches the exact release year of a track on-the-fly.
 */
export const fetchTrackYear = async (trackId: number): Promise<string> => {
  try {
    const data = await fetchDeezerJsonp(`https://api.deezer.com/track/${trackId}`);
    if (data && data.release_date) {
      return new Date(data.release_date).getFullYear().toString();
    }
  } catch (e) {
    console.error(`Failed to fetch track details for ID ${trackId} via JSONP:`, e);
  }
  return new Date().getFullYear().toString(); // safe fallback
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
        let query = term;
        if (term === 'ndw') {
          query = 'neue deutsche welle';
        } else if (term === 'deutscher rap') {
          query = 'deutscher rap';
        }
        
        const limit = 100;
        const url = `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=${limit}`;
        const data = await fetchDeezerJsonp(url);
        
        if (data && data.data) {
          resultsArray.push(data.data);
        }
      } catch (e) {
        console.error("Deezer fetch failed for term", term, e);
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
      // Left blank during pool fetch, loaded on-the-fly on BEGIN_TURN
      year: '', 
      previewUrl: t.preview,
      artworkUrl: t.album.cover_big,
    }));
  } catch (error) {
    console.error("Failed to fetch songs from Deezer:", error);
    return [];
  }
};
