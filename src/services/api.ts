import { Song } from '../types';

const SEARCH_TERMS = ['pop', 'rock', 'party', '90s', '2000s hits', 'dance', 'chart hits'];

import { normalizeString } from '../utils/stringUtils';

/**
 * Fallback proxy fetcher to bypass iOS Safari's native interception of iTunes
 * and strict browser CORS blocks. 
 */
const fetchWithProxyFallback = async (url: string): Promise<any> => {
  try {
    const res = await fetch(url);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    // Falls through to proxy if native fetch is intercepted by Apple Music
  }

  // We explicitly use CodeTabs with a trailing slash! 
  // CodeTabs natively strips the Mobile Safari User-Agent, bypassing the 301 Apple Music intercept.
  // The trailing slash prevents cross-origin 301 redirect CORS failures.
  const PROXIES = [
    `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?${encodeURIComponent(url)}`
  ];

  for (const proxyUrl of PROXIES) {
    try {
      const res = await fetch(proxyUrl);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn(`Proxy failed:`, proxyUrl, e);
    }
  }

  throw new Error('All proxy fetch attempts failed.');
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
        let data = await fetchWithProxyFallback(url);
        
        // Bulletproof fallback: If the genre isn't recognized natively by iTunes (e.g. "2000s hits"), fallback to a standard text search.
        if (!data.results || data.results.length === 0) {
          url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&limit=${limit}`;
          data = await fetchWithProxyFallback(url);
        }
        
        resultsArray.push(data.results || []);
      } catch (e) {
        console.error("Fetch failed for term", term, e);
      }
    }

    const allResults = resultsArray.flat();
    
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
