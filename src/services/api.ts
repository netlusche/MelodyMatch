import { Song } from '../types';
import { normalizeString } from '../utils/stringUtils';
import { shuffleArray } from '../utils/arrayUtils';

const GENRE_MAP: Record<string, number> = {
  'hip-hop': 116,
  'heavy metal': 464,
};

const PLAYLIST_MAP: Record<string, number | number[]> = {
  'rock': [11242423484, 752286631, 3126664682, 1419215845, 1057779131, 8621268482, 1728093421, 13693489781, 11335739484, 761604441, 11801167321], // Rock Super Hits, Rock Hits, Rock Road Trip, 2000s Rock, 2010s Rock, 80s Rock, 90s Rock, 2020s Rock, Modern Rock Essentials, Hard Rock Essentials, Rock Classics 60s-80s
  'pop': [1036183001, 8326097522, 8282573142, 1479458365, 2228601362, 1282483245, 4888783264, 1977689462, 5311155022, 5339620562], // Pop Essentials, 00s Pop, 10s Pop, Happy Hits, Fresh Pop, Pop All Stars, Pop Rewind, 00s Party Hits, Top Hits 2012, Top Hits 2010
  'electronic': [3801761042, 1902101402, 4613753548, 6237312204, 13577379741, 10578670022, 8962764402, 14787069183], // Electronic Essentials, Electronic Hits, Dance Essentials, Dance Party Classics, House Party Classics, Techno Essentials, Trip-Hop Essentials, 90er Electronic Essentials
  'r&b': [1314725125, 1999466402, 2021626162, 3196481502, 4160013622, 5411628342, 1699545511, 5014738124, 8869955482, 3166040342], // R&B Essentials, R&B Hits, 2000s R&B, Chill R&B, Women of R&B, 2010s R&B, R&B Rewind, 90s R&B, Slow Jam Essentials, RnB Classics
  'alternative': [668126235, 5337198442, 7966514882, 1126774471, 1402845615, 760160361, 8971696142, 1306978785, 127260811], // Alternative Essentials, 90s Alternative, alt 50, Alt Pop, New Alternative, Indie Rock Now, Synth Pop Essentials, Hot New Rock, Alternative Attack
  'indie': [9372936102, 754725481, 8716319082, 10452440062], // The Indie Café, crush <3, Indie Rock Essentials, Indie rock essentials
  'classic rock': [6046721604, 14233924321, 1306931615, 1405240385], // Rock Klassiker, Classic Rock Greatest Hits 1, Rock Essentials, 70s Rock
  'schlager': [8699026122, 2813303064, 1917690502, 11354266504, 12462638963], // Schlager Super Hits, Karneval Schlager Party, Schlagerparty, Schlager Sommer, Schlager Queens
  'ndw': [6758361584, 1230675621, 2734068964, 8937349862, 1106363531, 15022157843, 15344382803], // Neue Deutsche Welle, NDW Hits, Neue Deutsche Welle - NDW, NDW- Neue Deutsche Welle, ULTIMATE 80s NDW, NDW SaMu, 80er NDW
  'deutschpop': [11242422704, 10226082322, 8668716682], // Deutschpop Super Hits, Happy Deutschpop, Deutschpop Hits von heute
  'deutschrock': [1956739222, 6030118144, 10396822102], // Deutschrock Essentials, Deutsch Rock (Rammstein/Knorkator), Deutschland 00er
  'deutscher rap': [10578289242, 146820791, 11533942424, 8871685602, 13378558903], // Deutschrap Super Hits, Deutschrap Hits, Deutschrap Essentials, Deutschrap Klassiker, Deutschrap 2020s
  'ballermann': [10328601542, 9486947662, 4789726188, 7712049342], // Endlich wieder Malle, Après Ski Hits, Ballermann Hits Best Of, Ballermann (Markus Becker)
  'partyhits': [2097558104, 740966875, 11203091824, 8699026122, 1917690502, 10328601542], // Party Hits, Club Party Hits, Dance Hits, Schlager Super Hits, Schlagerparty, Endlich wieder Malle
  'new wave': [8515679522, 8700369282, 3291146382, 10082108122, 4055216422], // New Wave Essentials, Post-Punk Essentials, New Wave classics, New Wave - Dark Gothic post punk, 80s Oldschool Indie. New Wave & Post-Punk Classics
  
  // Decades
  '50s': [735402575, 4020144442, 11031329462, 3954210902, 9010212882, 5958115324], // 50s Rock 'n' Roll, Billboard 50s, Rock 'n' Roll classics, 50er/60er, 50's Blues, 50's Jazz
  '60s': [620264073, 1437011185, 8962730322, 14597757781, 8181759022, 3566625202, 11031329462], // 60s Hits, 60s Rock, 60s Pop, 60s Ballads, Billboard 60s, 60er, Rock 'n' Roll classics
  '70s': [1470022445, 8877326262, 5605928862, 57280214, 1319793647, 7130870324], // 70s Hits, 70s Happy Hits, 70er Jahre, 1970s, 70s Hits Top 100, 70s Greatest Hits
  '80s': [867825522, 1913763402, 11384036324, 6208592984, 8512471762, 8873745702, 8403360702], // 80s Hits, 80s Party Hits, 80's Essentials, 1980s, 80s Pop, 80s Happy Hits, 80s Ballads
  '90s': [878989033, 3829647662, 7852252022, 8873744282, 8403350722, 969361861], // 90s Hits, 90er Party Hits, Back to the 90 & 2000er, 90s Happy Hits, 90s Ballads, Année 1990 & 2000
  '2000+': [248297032, 715215865, 14917741483, 9100953002, 14285831341, 12272270431, 11308515444], // 00s Hits, 10s Party Hits, 10s Hits, 10s Ballads, 2000s-2010s Party, 20s Hits, Pop & Rock Hits
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

export const cleanAndNormalizeTitle = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // remove punctuation except spaces
    .split(/\s+/)                // split into words
    .map(word => {
      // Remove trailing 's' to normalize plurals/possessives
      if (word.length > 2 && word.endsWith('s') && !word.endsWith('ss')) {
        return word.slice(0, -1);
      }
      return word;
    })
    .filter(Boolean)
    .join('');
};

export const generateTitleVariations = (title: string): string[] => {
  const cleanTitle = cleanSongTitle(title);
  const variations = new Set<string>();
  variations.add(cleanTitle);

  // 1. Straight vs Curly Apostrophes replacement
  if (cleanTitle.includes("'") || cleanTitle.includes("’")) {
    const straight = cleanTitle.replace(/’/g, "'");
    const curly = cleanTitle.replace(/'/g, "’");
    const stripped = cleanTitle.replace(/['’]/g, "");
    variations.add(straight);
    variations.add(curly);
    variations.add(stripped);
  }

  // 2. If there are words ending in 's' without apostrophe, try adding it
  const words = cleanTitle.split(/\s+/);
  let changed = false;
  const newWordsStraight = words.map(word => {
    if (word.length > 2 && word.endsWith('s') && !word.endsWith('ss') && !word.includes("'") && !word.includes("’")) {
      changed = true;
      return word.slice(0, -1) + "'s";
    }
    return word;
  });
  if (changed) {
    const withStraight = newWordsStraight.join(' ');
    variations.add(withStraight);
    variations.add(withStraight.replace(/'/g, "’"));
  }

  return Array.from(variations);
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
  const targetNorm = cleanAndNormalizeTitle(cleanTitle);

  // 1. Try MusicBrainz API as primary source (CORS-friendly, very accurate for original years)
  try {
    const vars = generateTitleVariations(title);
    const recordingClauses = vars.map(v => `recording:"${cleanLuceneQuery(v)}"`).join(' OR ');
    const mbQuery = `artist:"${cleanLuceneQuery(cleanArtist)}" AND (${recordingClauses})`;
    const mbUrl = `https://musicbrainz.org/ws/2/recording/?query=${encodeURIComponent(mbQuery)}&limit=100&fmt=json`;
    const res = await fetchWithTimeout(mbUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MelodyMatch/1.0.0 ( frank@example.com )'
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

  // Helper function to extract the earliest year from matched iTunes results
  const getEarliestYearFromItunesResults = (results: any[]): string | null => {
    const years: number[] = [];
    results.forEach((r: any) => {
      if (r.trackName && r.releaseDate) {
        const trackClean = cleanSongTitle(r.trackName);
        const trackNorm = cleanAndNormalizeTitle(trackClean);
        if (trackNorm === targetNorm) {
          const yearStr = getYearFromString(r.releaseDate);
          if (yearStr) {
            const yr = parseInt(yearStr, 10);
            if (!isNaN(yr)) {
              years.push(yr);
            }
          }
        }
      }
    });
    return years.length > 0 ? Math.min(...years).toString() : null;
  };

  // 2. iTunes Fallback (Cascading proxies)
  const query = cleanQueryForYearSearch(artist, title);
  const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=10`;
  
  // 2.1. Try local dev proxy (/api-itunes)
  const devUrl = `/api-itunes/search?term=${encodeURIComponent(query)}&media=music&limit=10`;
  try {
    const res = await fetchWithTimeout(devUrl, {}, 1000);
    if (res.ok) {
      const data = await res.json();
      if (data && data.results) {
        const year = getEarliestYearFromItunesResults(data.results);
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
    const res = await fetchWithTimeout(`./proxy.php?term=${encodeURIComponent(query)}&media=music&limit=10`, {}, 1000);
    if (res.ok) {
      const data = await res.json();
      if (data && data.results) {
        const year = getEarliestYearFromItunesResults(data.results);
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
      if (data && data.results) {
        const year = getEarliestYearFromItunesResults(data.results);
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
          // Fetch all playlists in parallel using Promise.all
          const playlistPromises = playlistIds.map(async (pid) => {
            try {
              const url = `https://api.deezer.com/playlist/${pid}/tracks?limit=300`;
              const data = await fetchDeezerJsonp(url);
              if (data && data.data) {
                return data.data;
              }
            } catch (e) {
              console.error("Deezer playlist fetch failed for pid:", pid, e);
            }
            return [];
          });
          const resolvedDataList = await Promise.all(playlistPromises);
          resolvedDataList.forEach(data => {
            if (data && data.length > 0) {
              resultsArray.push(data);
            }
          });
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
    const blacklist = [
      'die drei ???',
      'die drei !!!',
      'bibi blocksberg',
      'tkkg',
      'benjamin blümchen',
      'hörspiel',
      'folge',
      'kapitel',
      'teufelsberg',
      'weihnachtsspiel'
    ];

    const filterAndDeduplicate = (tracks: any[]) => {
      return tracks.filter((t: any) => {
        if (!t.preview || !t.title || !t.artist || !t.artist.name || !t.album || !t.album.cover_big) return false;
        
        // Filter out audio plays (Hörspiele)
        const titleLower = t.title.toLowerCase();
        const artistLower = t.artist.name.toLowerCase();
        const isAudioPlay = blacklist.some(term => 
          titleLower.includes(term) || artistLower.includes(term)
        );
        if (isAudioPlay) return false;

        const matchKey = `${normalizeString(t.title)}-${normalizeString(t.artist.name)}`;
        if (uniqueKeys.has(matchKey)) return false;
        
        uniqueKeys.add(matchKey);
        return true;
      });
    };

    let validTracks = filterAndDeduplicate(allResults);

    // Fallback: If we don't have enough tracks, fetch from Deezer global top charts
    if (validTracks.length < count) {
      console.warn(`Song pool size (${validTracks.length}) is less than requested count (${count}). Fetching fallback tracks from global charts...`);
      try {
        const globalUrl = `https://api.deezer.com/chart/0/tracks?limit=300`;
        const globalData = await fetchDeezerJsonp(globalUrl);
        if (globalData && globalData.data) {
          const fallbackTracks = filterAndDeduplicate(globalData.data);
          validTracks = [...validTracks, ...fallbackTracks];
        }
      } catch (e) {
        console.error("Failed to fetch fallback tracks from global charts:", e);
      }
    }
    
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
      album: t.album?.title,
    }));
  } catch (error) {
    console.error("Failed to fetch songs from Deezer:", error);
    return [];
  }
};

/**
 * Refresh preview URLs for a list of songs by re-fetching each track from Deezer.
 * Deezer CDN preview URLs contain expiry tokens and become invalid after ~1-2 hours.
 * Failures are silently ignored — the original URL is kept as fallback.
 */
export const refreshPreviewUrls = async (songs: Song[]): Promise<Song[]> => {
  const refreshed = await Promise.all(
    songs.map(async (song) => {
      try {
        const data = await fetchDeezerJsonp(`https://api.deezer.com/track/${song.id}`);
        if (data?.preview) return { ...song, previewUrl: data.preview };
      } catch {
        // Keep original URL on failure
      }
      return song;
    })
  );
  return refreshed;
};
