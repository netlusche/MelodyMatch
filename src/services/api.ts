import { Song } from '../types';

const SEARCH_TERMS = ['pop', 'rock', 'party', '90s', '2000s hits', 'dance', 'chart hits'];

/**
 * Helper to bypass CORS securely strictly via iTunes' native JSONP callback support.
 */
const fetchJSONP = (url: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const callbackName = 'jsonp_callback_' + Math.round(1000000 * Math.random());
    const script = document.createElement('script');
    script.src = `${url}&callback=${callbackName}`;
    
    (window as any)[callbackName] = (data: any) => {
      resolve(data);
      if (document.body.contains(script)) document.body.removeChild(script);
      delete (window as any)[callbackName];
    };
    
    script.onerror = () => {
      reject(new Error('JSONP Request blocked or failed.'));
      if (document.body.contains(script)) document.body.removeChild(script);
      delete (window as any)[callbackName];
    };
    
    document.body.appendChild(script);
  });
};

export const fetchSongs = async (count: number, genres: string[] = ['all']): Promise<Song[]> => {
  try {
    let termsToSearch: string[] = [];
    
    if (genres.includes('all') || genres.length === 0) {
      termsToSearch = [SEARCH_TERMS[Math.floor(Math.random() * SEARCH_TERMS.length)]];
    } else {
      termsToSearch = genres;
    }

    const countPerGenre = Math.ceil(count / termsToSearch.length);
    const limit = 200; // Force Maximum breadth per genre to maximize unique variety pool!
    
    const resultsArray = [];
    for (const term of termsToSearch) {
      try {
        let url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&attribute=genreTerm&media=music&limit=${limit}`;
        let data = await fetchJSONP(url);
        
        // Bulletproof fallback: If the genre isn't recognized natively by iTunes (e.g. "2000s hits"), fallback to a standard text search.
        if (!data.results || data.results.length === 0) {
          url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&limit=${limit}`;
          data = await fetchJSONP(url);
        }
        
        resultsArray.push(data.results || []);
      } catch (e) {
        console.error("Fetch failed for term", term, e);
      }
    }

    const allResults = resultsArray.flat();
    
    // Aggressive RegExp normalizer to strip "(Radio Edit)", "[Remastered]", "- Single Version", and non-alphanumerics
    const normalizeString = (str: string) => {
      if (!str) return "";
      return str.toLowerCase()
        .replace(/\(.*?\)/g, '') // remove anything in parentheses
        .replace(/\[.*?\]/g, '') // remove anything in brackets
        .replace(/\s-.*?$/g, '') // remove anything after a spaced hyphen
        .replace(/feat\..*|ft\..*/g, '') // remove featuring artists
        .replace(/[^a-z0-9]/g, '') // strip all remaining punctuation and whitespace
        .trim();
    };

    // Filter out invalid items and definitively deduplicate tracks from overlapping genres and distinct compilation albums using normalized string keys
    const uniqueKeys = new Set();
    const validTracks = allResults.filter((t: any) => {
      if (!t.previewUrl || !t.trackName || !t.artistName || !t.releaseDate || !t.artworkUrl100) return false;
      
      const matchKey = `${normalizeString(t.trackName)}-${normalizeString(t.artistName)}`;
      if (uniqueKeys.has(matchKey)) return false;
      
      uniqueKeys.add(matchKey);
      return true;
    });
    
    // Shuffle the tracks
    const shuffled = validTracks.sort(() => 0.5 - Math.random());
    
    // Map to our Song type, getting a higher quality cover art
    return shuffled.slice(0, count).map((t: any) => ({
      id: t.trackId,
      title: t.trackName,
      artist: t.artistName,
      // Take only the year from ISO date strings
      year: new Date(t.releaseDate).getFullYear().toString(),
      previewUrl: t.previewUrl,
      // iTunes provides 100x100, we swap the string for 600x600 for high-res
      artworkUrl: t.artworkUrl100.replace('100x100bb', '600x600bb'),
    }));
  } catch (error) {
    console.error("Failed to fetch songs from iTunes:", error);
    return [];
  }
};
