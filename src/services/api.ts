import { Song } from '../types';

const SEARCH_TERMS = ['pop', 'rock', 'party', '90s', '2000s hits', 'dance', 'chart hits'];

import { normalizeString } from '../utils/stringUtils';

/**
 * Direct JSONP fetcher to completely bypass CORS preflight blocks and
 * iOS Safari native redirections to Apple Music.
 */
const fetchJsonp = (url: string, callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random())): Promise<any> => {
  return new Promise((resolve, reject) => {
    const hasParams = url.includes('?');
    const jsonpUrl = `${url}${hasParams ? '&' : '?'}callback=${callbackName}`;
    
    const script = document.createElement('script');
    script.src = jsonpUrl;
    script.async = true;
    
    // Set a timeout of 8 seconds to prevent hanging on network failures
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error(`JSONP request timed out for url: ${url}`));
    }, 8000);

    (window as any)[callbackName] = (data: any) => {
      clearTimeout(timeoutId);
      resolve(data);
      cleanup();
    };
    
    script.onerror = () => {
      clearTimeout(timeoutId);
      reject(new Error(`JSONP request failed for url: ${url}`));
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
 * Fetcher that attempts direct JSONP first, and falls back to CORS proxies
 * sequentially if direct requests fail.
 */
const fetchWithProxyFallback = async (url: string): Promise<any> => {
  // 1. Primary: Use local proxy route (/api-itunes/) to bypass all CORS and User-Agent restrictions.
  // This works natively in local development via Vite's dev server proxy,
  // and in production if the hosting server has a redirect/proxy rule configured for /api-itunes.
  const relativeUrl = url
    .replace('https://ax.itunes.apple.com/WebObjects/MZStoreServices.woa/wa/wsSearch', '/api-itunes/search')
    .replace('https://itunes.apple.com/search', '/api-itunes/search');
  
  if (relativeUrl.startsWith('/api-itunes/')) {
    try {
      const res = await fetch(relativeUrl);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Local proxy fetch failed, falling back to public proxies:", e);
    }
  }

  // Convert ax.itunes.apple.com MZStoreServices URL back to itunes.apple.com/search
  // to ensure compatibility with standard proxy routes and server-side parsers.
  const standardUrl = url
    .replace('ax.itunes.apple.com/WebObjects/MZStoreServices.woa/wa/wsSearch', 'itunes.apple.com/search')
    .replace('ax.itunes.apple.com', 'itunes.apple.com');

  // 1.5. Try local PHP proxy (proxy.php) if deployed on a PHP-enabled server.
  // This avoids CORS and handles requests server-side, returning raw JSON.
  const queryStr = standardUrl.split('?')[1] || '';
  const phpProxyUrl = `./proxy.php?${queryStr}`;
  try {
    const res = await fetch(phpProxyUrl);
    if (res.ok) {
      const data = await res.json();
      if (data && (data.results || data.resultCount !== undefined)) {
        return data;
      }
    }
  } catch (e) {
    console.warn("Local PHP proxy fetch failed or not available, trying public proxies:", e);
  }

  // 2. Secondary: AllOrigins raw proxy (server-side fetch, strips iOS UA, returns raw JSON)
  try {
    const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(standardUrl)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && (data.results || data.resultCount !== undefined)) {
        return data;
      }
    }
  } catch (e) {
    console.warn("AllOrigins raw proxy failed:", e);
  }

  // 3. Tertiary: CodeTabs proxy (strips iOS User-Agent, returns raw JSON)
  try {
    const res = await fetch(`https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(standardUrl)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && (data.results || data.resultCount !== undefined)) {
        return data;
      }
    }
  } catch (e) {
    console.warn("CodeTabs proxy failed:", e);
  }

  // 4. Quaternary: Direct JSONP on ax.itunes.apple.com (CORS-free, Universal-Link-immune)
  try {
    const data = await fetchJsonp(url);
    if (data && (data.results || data.resultCount !== undefined)) {
      return data;
    }
  } catch (e) {
    console.warn('Direct JSONP on ax failed:', e);
  }

  // 5. Quinary: Direct JSONP on standard itunes.apple.com
  try {
    const data = await fetchJsonp(standardUrl);
    if (data && (data.results || data.resultCount !== undefined)) {
      return data;
    }
  } catch (e) {
    console.warn('Direct JSONP on standard failed:', e);
  }

  throw new Error('All fetch attempts (local proxy, public proxies, and JSONP) failed.');
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
        let url = `https://ax.itunes.apple.com/WebObjects/MZStoreServices.woa/wa/wsSearch?term=${encodeURIComponent(term)}&attribute=genreTerm&media=music&limit=${limit}`;
        let data = await fetchWithProxyFallback(url);
        
        // Bulletproof fallback: If the genre isn't recognized natively by iTunes (e.g. "2000s hits"), fallback to a standard text search.
        if (!data.results || data.results.length === 0) {
          url = `https://ax.itunes.apple.com/WebObjects/MZStoreServices.woa/wa/wsSearch?term=${encodeURIComponent(term)}&media=music&limit=${limit}`;
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
