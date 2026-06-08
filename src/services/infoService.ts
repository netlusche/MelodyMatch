/**
 * Services to fetch track background information from Wikipedia and lyrics from LRCLIB.
 */

export interface WikiResult {
  extract: string;
  url: string;
  badge: 'wikiFallbackSong' | 'wikiFallbackArtist';
}

/**
 * Clean track title of featuring artists, remaster tags, and spacing hyphens.
 */
const cleanTitle = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/\(.*?\)/g, '')         // remove anything in parentheses
    .replace(/\[.*?\]/g, '')         // remove anything in brackets
    .replace(/\s-.*?$/g, '')         // remove anything after a spaced hyphen
    .replace(/feat\..*|ft\..*/gi, '') // remove featuring artists
    .trim();
};

/**
 * Clean artist name of any extra collaboration details.
 */
const cleanArtist = (str: string): string => {
  if (!str) return '';
  return str.split(',')[0].split('&')[0].replace(/feat\..*|ft\..*/gi, '').trim();
};

/**
 * Fetch a summary from Wikipedia for either the song or the artist as a fallback.
 */
export const fetchWikipediaSummary = async (title: string, artist: string): Promise<WikiResult | null> => {
  const cTitle = cleanTitle(title);
  const cArtist = cleanArtist(artist);

  if (!cTitle || !cArtist) return null;

  try {
    // 1. Try Song search: e.g. "Bohemian Rhapsody" "Queen"
    const songQuery = `"${cTitle}" "${cArtist}"`;
    const songSearchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(songQuery)}&format=json&origin=*`;
    const songSearchRes = await fetch(songSearchUrl).then(r => r.json());
    const songPage = songSearchRes.query?.search?.[0];

    if (songPage) {
      const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(songPage.title)}`;
      const summary = await fetch(summaryUrl).then(r => r.json());
      if (summary.extract) {
        return {
          extract: summary.extract,
          url: summary.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(songPage.title)}`,
          badge: 'wikiFallbackSong'
        };
      }
    }

    // 2. Try Artist search fallback: e.g. "Queen" band OR singer OR musician
    const artistQuery = `"${cArtist}" band OR singer OR musician OR group`;
    const artistSearchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(artistQuery)}&format=json&origin=*`;
    const artistSearchRes = await fetch(artistSearchUrl).then(r => r.json());
    const artistPage = artistSearchRes.query?.search?.[0];

    if (artistPage) {
      const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(artistPage.title)}`;
      const summary = await fetch(summaryUrl).then(r => r.json());
      if (summary.extract) {
        return {
          extract: summary.extract,
          url: summary.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(artistPage.title)}`,
          badge: 'wikiFallbackArtist'
        };
      }
    }
  } catch (error) {
    console.warn("Wikipedia summary fetch failed:", error);
  }
  
  return null;
};

/**
 * Fetch lyrics from the LRCLIB API.
 */
export const fetchLyrics = async (title: string, artist: string): Promise<string | null> => {
  const cTitle = cleanTitle(title);
  const cArtist = cleanArtist(artist);

  if (!cTitle || !cArtist) return null;

  // Helper for fetch with timeout
  const fetchWithTimeout = async (url: string, timeout = 2000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(id);
      return response;
    } catch (err) {
      clearTimeout(id);
      throw err;
    }
  };

  // Strategy 1: Fast Search (queries only internal database, no external scraper overhead)
  const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(cArtist + ' ' + cTitle)}`;
  try {
    const res = await fetchWithTimeout(searchUrl, 1500);
    if (res.ok) {
      const results = await res.json();
      if (Array.isArray(results) && results.length > 0) {
        // Find the first result containing lyrics and matching the artist name
        const bestMatch = results.find(r => 
          (r.plainLyrics || r.syncedLyrics) && 
          r.artistName.toLowerCase().includes(cArtist.toLowerCase())
        );
        if (bestMatch) {
          return bestMatch.plainLyrics || bestMatch.syncedLyrics || null;
        }
      }
    }
  } catch (error) {
    console.warn("Fast lyrics search failed or timed out:", error);
  }

  // Strategy 2: Direct Get with short timeout fallback
  const getUrl = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(cArtist)}&track_name=${encodeURIComponent(cTitle)}`;
  try {
    const res = await fetchWithTimeout(getUrl, 2000);
    if (res.ok) {
      const data = await res.json();
      return data.plainLyrics || data.syncedLyrics || null;
    }
  } catch (error) {
    console.warn("Fallback direct lyrics fetch failed or timed out:", error);
  }

  return null;
};

/**
 * Construct a Genius.com lyrics URL client-side deterministically.
 */
export const getGeniusUrl = (artist: string, title: string): string => {
  const cleanStr = (str: string) => {
    return str
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[.,'\"()\[\]!]/g, '')
      .replace(/[\s\/\\_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const cleanA = cleanStr(cleanArtist(artist));
  const cleanT = cleanStr(cleanTitle(title));

  return `https://genius.com/${cleanA}-${cleanT}-lyrics`;
};
