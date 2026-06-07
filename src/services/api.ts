import { Song } from '../types';
import { normalizeString } from '../utils/stringUtils';
import { shuffleArray } from '../utils/arrayUtils';

const GENRE_MAP: Record<string, number> = {
  'pop': 132,
  'rock': 152,
  'hip-hop': 116,
  'electronic': 106, // Electro
  'r&b': 165,        // R&B
  'alternative': 85, // Alternative
  'heavy metal': 464, // Heavy Metal
};

const PLAYLIST_MAP: Record<string, number | number[]> = {
  'indie': 9372936102, // The Indie Café
  'classic rock': 6046721604, // Rock Klassiker
  'schlager': 8699026122, // Schlager Hits
  'ndw': 6758361584, // Neue Deutsche Welle
  'deutschpop': 11242422704, // Deutschpop Hits
  'deutschrock': 1956739222, // Deutschrock
  'deutscher rap': 10578289242, // Deutscher Rap Hits
  'ballermann': 10328601542, // Ballermann Party Hits
  'partyhits': 2097558104, // Party Hits
  'new wave': [8515679522, 8700369282], // New Wave Essentials & Post-Punk Essentials
  
  // Decades
  '50s': [735402575, 4020144442],
  '60s': [620264073, 1437011185],
  '70s': [1470022445, 8877326262],
  '80s': [867825522, 1913763402],
  '90s': [878989033, 3829647662],
  '2000+': [248297032, 715215865],
};

const SEARCH_TERMS = ['pop music', 'rock music', 'party hits', '90s hits', '2000s hits', 'dance music', 'chart hits'];

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
    }, 2000);

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

const getYearFromString = (dateStr: string): string | null => {
  if (!dateStr) return null;
  const parsed = new Date(dateStr).getFullYear();
  if (isNaN(parsed) || parsed < 1900 || parsed > new Date().getFullYear() + 2) {
    // Regex fallback to find any 4-digit year starting with 19 or 20
    const match = dateStr.match(/\b(19\d\d|20\d\d)\b/);
    return match ? match[1] : null;
  }
  return parsed.toString();
};

export const cleanSongTitle = (title: string): string => {
  if (!title) return "";
  let clean = title
    .replace(/\(.*?(remaster|live|edit|version|mono|stereo|anniversary|deluxe|mix|remix|re-?recorded|recorded).*?\)/gi, '')
    .replace(/\[.*?(remaster|live|edit|version|mono|stereo|anniversary|deluxe|mix|remix|re-?recorded|recorded).*?\]/gi, '')
    .replace(/\s+-\s+.*?(remaster|live|edit|version|mono|stereo|anniversary|deluxe|mix|remix|re-?recorded|recorded).*?$/gi, '')
    .trim();
  return clean || title;
};

const cleanQueryForYearSearch = (artist: string, title: string): string => {
  const cleanTitle = cleanSongTitle(title);
  // Strip featuring artist suffixes
  const cleanArtist = artist.replace(/\s+(feat|ft)\.?\s+.*$/gi, '').trim();

  return `${cleanArtist} ${cleanTitle}`;
};

const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs = 1200): Promise<Response> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
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
 * It queries the iTunes API (via local dev proxy, local PHP proxy, or AllOrigins CORS proxy)
 * because iTunes accurately tracks and returns the *original* release year of a song
 * even when it is hosted on a compilation or remastered album.
 * Falls back to Deezer track metadata if iTunes queries fail.
 */
const cleanLuceneQuery = (str: string): string => {
  return str
    .replace(/[+\-&|!(){}\[\]^"~*?:\\\/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const fetchTrackYear = async (trackId: number, title: string, artist: string): Promise<string> => {
  const cleanTitle = cleanSongTitle(title);
  const cleanArtist = artist.replace(/\s+(feat|ft)\.?\s+.*$/gi, '').trim();

  // 1. Try MusicBrainz API as primary source (CORS-friendly, very accurate for original years)
  try {
    const mbQuery = `artist:"${cleanLuceneQuery(cleanArtist)}" AND recording:"${cleanLuceneQuery(cleanTitle)}"`;
    const mbUrl = `https://musicbrainz.org/ws/2/recording/?query=${encodeURIComponent(mbQuery)}&limit=100&fmt=json`;
    const res = await fetchWithTimeout(mbUrl, {
      headers: {
        'Accept': 'application/json'
      }
    }, 1500);

    if (res.ok) {
      const data = await res.json();
      const recordings = data.recordings || [];
      const years: number[] = [];
      
      recordings.forEach((rec: any) => {
        const dateStr = rec['first-release-date'];
        if (dateStr && dateStr.length >= 4) {
          const yearPart = parseInt(dateStr.substring(0, 4), 10);
          if (!isNaN(yearPart) && yearPart >= 1900 && yearPart <= new Date().getFullYear() + 2) {
            years.push(yearPart);
          }
        }
      });
      
      if (years.length > 0) {
        const earliestYear = Math.min(...years).toString();
        console.log(`Fetched original year via MusicBrainz for "${cleanArtist} - ${cleanTitle}":`, earliestYear);
        return earliestYear;
      }
    }
  } catch (e) {
    console.warn("MusicBrainz year fetch failed, cascading to iTunes...", e);
  }

  // 2. iTunes Fallback (Cascading proxies)
  const query = cleanQueryForYearSearch(artist, title);
  const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=1`;
  
  // 2.1. Try local dev proxy (/api-itunes)
  const devUrl = `/api-itunes/search?term=${encodeURIComponent(query)}&media=music&limit=1`;
  try {
    const res = await fetchWithTimeout(devUrl, {}, 1000);
    if (res.ok) {
      const data = await res.json();
      if (data && data.results && data.results[0] && data.results[0].releaseDate) {
        const year = getYearFromString(data.results[0].releaseDate);
        if (year) {
          console.log(`Fetched original year via dev proxy for "${query}":`, year);
          return year;
        }
      }
    }
  } catch (e) {
    // Expected to fail in production
  }

  // 2.2. Try local PHP proxy (proxy.php) if available (for Strato production)
  try {
    const res = await fetchWithTimeout(`./proxy.php?term=${encodeURIComponent(query)}&media=music&limit=1`, {}, 1000);
    if (res.ok) {
      const data = await res.json();
      if (data && data.results && data.results[0] && data.results[0].releaseDate) {
        const year = getYearFromString(data.results[0].releaseDate);
        if (year) {
          console.log(`Fetched original year via local PHP proxy for "${query}":`, year);
          return year;
        }
      }
    }
  } catch (e) {
    console.warn("Local PHP proxy failed for year fetch:", e);
  }

  // 2.3. Try AllOrigins raw proxy
  try {
    const res = await fetchWithTimeout(`https://api.allorigins.win/raw?url=${encodeURIComponent(itunesUrl)}`, {}, 1500);
    if (res.ok) {
      const data = await res.json();
      if (data && data.results && data.results[0] && data.results[0].releaseDate) {
        const year = getYearFromString(data.results[0].releaseDate);
        if (year) {
          console.log(`Fetched original year via AllOrigins for "${query}":`, year);
          return year;
        }
      }
    }
  } catch (e) {
    console.warn("AllOrigins proxy failed for year fetch:", e);
  }

  // 3. Fallback: Fetch Deezer track details (might be compilation year, but safe fallback)
  try {
    const data = await fetchDeezerJsonp(`https://api.deezer.com/track/${trackId}`);
    if (data && data.release_date) {
      const year = getYearFromString(data.release_date);
      if (year) {
        console.log(`Fetched fallback year via Deezer for "${query}":`, year);
        return year;
      }
    }
  } catch (e) {
    console.error("Deezer year fetch failed:", e);
  }

  return new Date().getFullYear().toString(); // safe fallback
};

export const fetchSongs = async (count: number, genres: string[] = ['all']): Promise<Song[]> => {
  try {
    const termsToSearch = genres.length === 0 ? ['all'] : genres;

    const resultsArray = [];
    for (const term of termsToSearch) {
      try {
        if (term === 'all') {
          // Global top tracks chart
          const url = `https://api.deezer.com/chart/0/tracks?limit=300`;
          const data = await fetchDeezerJsonp(url);
          if (data && data.data) resultsArray.push(data.data);
        } else if (GENRE_MAP[term] !== undefined) {
          // Genre specific chart to get popular songs instead of literal search matches
          const url = `https://api.deezer.com/chart/${GENRE_MAP[term]}/tracks?limit=300`;
          const data = await fetchDeezerJsonp(url);
          if (data && data.data) resultsArray.push(data.data);
        } else if (PLAYLIST_MAP[term] !== undefined) {
          // Curated playlist for sub-genres and specific categories (supports single ID or array)
          const val = PLAYLIST_MAP[term];
          const playlistIds = Array.isArray(val) ? val : [val];
          for (const pid of playlistIds) {
            try {
              const url = `https://api.deezer.com/playlist/${pid}/tracks?limit=300`;
              const data = await fetchDeezerJsonp(url);
              if (data && data.data) {
                resultsArray.push(data.data);
              }
            } catch (e) {
              console.error("Deezer playlist fetch failed for pid:", pid, e);
            }
          }
        } else {
          // Fallback search
          const url = `https://api.deezer.com/search?q=${encodeURIComponent(term)}&limit=300`;
          const data = await fetchDeezerJsonp(url);
          if (data && data.data) resultsArray.push(data.data);
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
    const shuffled = shuffleArray(validTracks);
    
    // Map to our Song type
    return shuffled.slice(0, count).map((t: any) => ({
      id: t.id,
      title: cleanSongTitle(t.title),
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
