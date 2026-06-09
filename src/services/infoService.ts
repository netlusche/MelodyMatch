/**
 * Services to fetch track background information from Wikipedia and lyrics from LRCLIB.
 */

export interface WikiResult {
  extract: string;
  url: string;
  badge: 'wikiFallbackSong' | 'wikiFallbackAlbum' | 'wikiFallbackArtist';
  artistUrl?: string;
  albumUrl?: string;
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
const isValidMatch = (query: string, pageTitle: string): boolean => {
  const cleanTitle = pageTitle.replace(/\(.*?\)/g, '').trim().toLowerCase();
  const cleanQuery = query.toLowerCase();

  const normTitle = cleanTitle.replace(/^the\s+/, '').trim();
  const normQuery = cleanQuery.replace(/^the\s+/, '').trim();

  const alphaSpace = (s: string) => s.replace(/[^a-z0-9\säöüß]/g, '').replace(/\s+/g, ' ').trim();
  const cleanNormTitle = alphaSpace(normTitle);
  const cleanNormQuery = alphaSpace(normQuery);

  if (cleanNormTitle === cleanNormQuery) return true;

  const titleWords = cleanNormTitle.split(' ');
  const queryWords = cleanNormQuery.split(' ');

  const titleHasExtraWords = titleWords.some(w => !queryWords.includes(w));
  if (titleHasExtraWords) return false;

  const missingQueryWords = queryWords.some(w => !titleWords.includes(w));
  if (missingQueryWords) return false;

  return true;
};

const isArtistPage = (pageTitle: string): boolean => {
  const titleLower = pageTitle.toLowerCase();
  const artistDisambiguations = [
    '(sänger',
    '(sängerin',
    '(band',
    '(musiker',
    '(musikerin',
    '(rapper',
    '(rapperin',
    '(gruppe',
    '(duo',
    '(trio',
    '(singer',
    '(musician',
    '(vocalist',
    '(composer',
    '(komponist'
  ];
  return artistDisambiguations.some(term => titleLower.includes(term));
};

const isAlbumPage = (pageTitle: string): boolean => {
  const titleLower = pageTitle.toLowerCase();
  const albumDisambiguations = [
    '(album',
    '(ep',
    '(kompilation',
    '(schallplatte',
    '(cd',
    '(lp',
    '(soundtrack',
    '(diskografie'
  ];
  return albumDisambiguations.some(term => titleLower.includes(term));
};



const isDisambiguationPage = async (sub: string, title: string): Promise<boolean> => {
  try {
    const summaryUrl = `https://${sub}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const summary = await fetch(summaryUrl).then(r => r.json());
    return summary.type === 'disambiguation';
  } catch (e) {
    return false;
  }
};

const isExplicitSongPage = (pageTitle: string, description?: string, extract?: string): boolean => {
  const titleLower = pageTitle.toLowerCase();
  const descLower = (description || '').toLowerCase();
  const extLower = (extract || '').toLowerCase();

  if (titleLower.includes('(song)') || 
      titleLower.includes('(lied)') || 
      titleLower.includes('(single)') || 
      titleLower.includes('(track)') ||
      titleLower.includes('(chanson)')) {
    return true;
  }

  const songTerms = [
    'song', 'lied', 'single', 'chanson', 'track', 'musikstück', 
    'komposition', 'schlager', 'popmusik-song', 'popsong', 'rocksong'
  ];
  if (songTerms.some(term => {
    const regex = new RegExp(`\\b${term}\\b|\\b${term}s\\b`, 'i');
    return regex.test(descLower);
  })) {
    if (!descLower.includes('album') && !descLower.includes('ep') && !descLower.includes('lp')) {
      return true;
    }
  }

  const firstWords = extLower.slice(0, 100);
  const songPhrases = [
    'ist ein lied', 'ist ein popsong', 'ist ein rocksong', 'ist ein chanson',
    'ist eine single', 'is a song', 'is a single', 'is a pop song', 'is a rock song'
  ];
  if (songPhrases.some(phrase => firstWords.includes(phrase))) {
    if (!firstWords.includes('album') && !firstWords.includes('compilation')) {
      return true;
    }
  }

  return false;
};

const findArtistPage = async (sub: string, cArtist: string): Promise<string | null> => {
  try {
    // 1. Precise title search
    const preciseQuery = `intitle:"${cArtist}"`;
    const preciseUrl = `https://${sub}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(preciseQuery)}&format=json&origin=*&srlimit=50`;
    const preciseRes = await fetch(preciseUrl).then(r => r.json());
    if (preciseRes.query?.search && Array.isArray(preciseRes.query.search)) {
      for (const page of preciseRes.query.search) {
        if (page.title.includes('(') && !isArtistPage(page.title)) continue;
        if (isValidMatch(cArtist, page.title)) {
          if (await isDisambiguationPage(sub, page.title)) continue;
          return `https://${sub}.wikipedia.org/wiki/${encodeURIComponent(page.title)}`;
        }
      }
    }

    // 2. Broad fallback search
    const artistQuery = `"${cArtist}" band OR singer OR musician OR group`;
    const url = `https://${sub}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(artistQuery)}&format=json&origin=*&srlimit=50`;
    const res = await fetch(url).then(r => r.json());
    if (res.query?.search && Array.isArray(res.query.search)) {
      for (const page of res.query.search) {
        if (page.title.includes('(') && !isArtistPage(page.title)) continue;
        if (isValidMatch(cArtist, page.title)) {
          if (await isDisambiguationPage(sub, page.title)) continue;
          return `https://${sub}.wikipedia.org/wiki/${encodeURIComponent(page.title)}`;
        }
      }
    }
  } catch (e) {
    console.warn("Error finding artist page:", e);
  }
  return null;
};

const findAlbumPage = async (sub: string, albumName: string, cArtist: string): Promise<string | null> => {
  try {
    // 1. Precise title search
    const preciseQuery = `intitle:"${albumName}" "${cArtist}"`;
    const preciseUrl = `https://${sub}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(preciseQuery)}&format=json&origin=*&srlimit=50`;
    const preciseRes = await fetch(preciseUrl).then(r => r.json());
    if (preciseRes.query?.search && Array.isArray(preciseRes.query.search)) {
      for (const page of preciseRes.query.search) {
        if (page.title.includes('(')) {
          if (isArtistPage(page.title) || !isAlbumPage(page.title)) continue;
        }
        if (isValidMatch(albumName, page.title)) {
          try {
            const summaryUrl = `https://${sub}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(page.title)}`;
            const summary = await fetch(summaryUrl).then(r => r.json());
            if (summary.type === 'disambiguation') continue;
            if (isExplicitSongPage(page.title, summary.description, summary.extract)) continue;
          } catch (e) {}
          return `https://${sub}.wikipedia.org/wiki/${encodeURIComponent(page.title)}`;
        }
      }
    }

    // 2. Broad fallback search
    const albumQuery = `"${albumName}" "${cArtist}" album`;
    const url = `https://${sub}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(albumQuery)}&format=json&origin=*&srlimit=50`;
    const res = await fetch(url).then(r => r.json());
    if (res.query?.search && Array.isArray(res.query.search)) {
      for (const page of res.query.search) {
        if (page.title.includes('(')) {
          if (isArtistPage(page.title) || !isAlbumPage(page.title)) continue;
        }
        if (isValidMatch(albumName, page.title)) {
          try {
            const summaryUrl = `https://${sub}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(page.title)}`;
            const summary = await fetch(summaryUrl).then(r => r.json());
            if (summary.type === 'disambiguation') continue;
            if (isExplicitSongPage(page.title, summary.description, summary.extract)) continue;
          } catch (e) {}
          return `https://${sub}.wikipedia.org/wiki/${encodeURIComponent(page.title)}`;
        }
      }
    }
  } catch (e) {
    console.warn("Error finding album page:", e);
  }
  return null;
};

const wikiCache = new Map<string, WikiResult>();

/**
 * Fetch a summary from Wikipedia for either the song, the album, or the artist as a fallback.
 */
export const fetchWikipediaSummary = async (title: string, artist: string, lang: 'en' | 'de' = 'en', albumName?: string): Promise<WikiResult | null> => {
  const cTitle = cleanTitle(title);
  const cArtist = cleanArtist(artist);
  const cAlbum = albumName ? cleanTitle(albumName) : undefined;

  if (!cTitle || !cArtist) return null;

  const cacheKey = `${cTitle}|${cArtist}|${lang}`;
  if (wikiCache.has(cacheKey)) return wikiCache.get(cacheKey)!;

  const primarySub = lang === 'de' ? 'de' : 'en';
  const secondarySub = lang === 'de' ? 'en' : 'de';

  const trySong = async (sub: string): Promise<WikiResult | null> => {
    try {
      const songQuery = `"${cTitle}" "${cArtist}"`;
      const songSearchUrl = `https://${sub}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(songQuery)}&format=json&origin=*&srlimit=50`;
      const songSearchRes = await fetch(songSearchUrl).then(r => r.json());
      
      if (songSearchRes.query?.search && Array.isArray(songSearchRes.query.search)) {
        for (const page of songSearchRes.query.search) {
          const cleanPageTitle = page.title.replace(/\(.*?\)/g, '').trim().toLowerCase();
          const cleanSearchTitle = cTitle.toLowerCase();
          const cleanAlpha = (s: string) => s.replace(/[^a-z0-9äöüß]/g, '');
          const alphaPage = cleanAlpha(cleanPageTitle);
          const alphaSearch = cleanAlpha(cleanSearchTitle);
          
          if (alphaPage === alphaSearch) {
            const summaryUrl = `https://${sub}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(page.title)}`;
            const summary = await fetch(summaryUrl).then(r => r.json());
            if (summary.type === 'disambiguation') continue;
            if (summary.extract) {
              const [artistUrl, albumUrl] = await Promise.all([
                findArtistPage(sub, cArtist),
                cAlbum ? findAlbumPage(sub, cAlbum, cArtist) : Promise.resolve(null)
              ]);
              return {
                extract: summary.extract,
                url: summary.content_urls?.desktop?.page || `https://${sub}.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
                badge: 'wikiFallbackSong',
                artistUrl: artistUrl || undefined,
                albumUrl: albumUrl || undefined
              };
            }
          }
        }
      }
    } catch (error) {
      console.warn(`Wikipedia song summary fetch failed for ${sub}:`, error);
    }
    return null;
  };

  const tryAlbum = async (sub: string): Promise<WikiResult | null> => {
    if (!cAlbum) return null;
    try {
      // 1. Precise title search
      const preciseQuery = `intitle:"${cAlbum}" "${cArtist}"`;
      const preciseSearchUrl = `https://${sub}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(preciseQuery)}&format=json&origin=*&srlimit=50`;
      const preciseSearchRes = await fetch(preciseSearchUrl).then(r => r.json());
      
      if (preciseSearchRes.query?.search && Array.isArray(preciseSearchRes.query.search)) {
        for (const page of preciseSearchRes.query.search) {
          if (page.title.includes('(')) {
            if (isArtistPage(page.title) || !isAlbumPage(page.title)) continue;
          }
          if (isValidMatch(cAlbum, page.title)) {
            const summaryUrl = `https://${sub}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(page.title)}`;
            const summary = await fetch(summaryUrl).then(r => r.json());
            if (summary.type === 'disambiguation') continue;
            if (isExplicitSongPage(page.title, summary.description, summary.extract)) continue;
            if (summary.extract) {
              const artistUrl = await findArtistPage(sub, cArtist);
              return {
                extract: summary.extract,
                url: summary.content_urls?.desktop?.page || `https://${sub}.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
                badge: 'wikiFallbackAlbum',
                artistUrl: artistUrl || undefined
              };
            }
          }
        }
      }

      // 2. Broad fallback search
      const albumQuery = `"${cAlbum}" "${cArtist}" album`;
      const albumSearchUrl = `https://${sub}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(albumQuery)}&format=json&origin=*&srlimit=50`;
      const albumSearchRes = await fetch(albumSearchUrl).then(r => r.json());
      
      if (albumSearchRes.query?.search && Array.isArray(albumSearchRes.query.search)) {
        for (const page of albumSearchRes.query.search) {
          if (page.title.includes('(')) {
            if (isArtistPage(page.title) || !isAlbumPage(page.title)) continue;
          }
          if (isValidMatch(cAlbum, page.title)) {
            const summaryUrl = `https://${sub}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(page.title)}`;
            const summary = await fetch(summaryUrl).then(r => r.json());
            if (summary.type === 'disambiguation') continue;
            if (isExplicitSongPage(page.title, summary.description, summary.extract)) continue;
            if (summary.extract) {
              const artistUrl = await findArtistPage(sub, cArtist);
              return {
                extract: summary.extract,
                url: summary.content_urls?.desktop?.page || `https://${sub}.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
                badge: 'wikiFallbackAlbum',
                artistUrl: artistUrl || undefined
              };
            }
          }
        }
      }
    } catch (error) {
      console.warn(`Wikipedia album summary fetch failed for ${sub}:`, error);
    }
    return null;
  };

  const tryArtist = async (sub: string): Promise<WikiResult | null> => {
    try {
      // 1. Precise title search
      const preciseQuery = `intitle:"${cArtist}"`;
      const preciseSearchUrl = `https://${sub}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(preciseQuery)}&format=json&origin=*&srlimit=50`;
      const preciseSearchRes = await fetch(preciseSearchUrl).then(r => r.json());
      
      if (preciseSearchRes.query?.search && Array.isArray(preciseSearchRes.query.search)) {
        for (const page of preciseSearchRes.query.search) {
          if (page.title.includes('(') && !isArtistPage(page.title)) continue;
          if (isValidMatch(cArtist, page.title)) {
            const summaryUrl = `https://${sub}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(page.title)}`;
            const summary = await fetch(summaryUrl).then(r => r.json());
            if (summary.type === 'disambiguation') continue;
            if (summary.extract) {
              return {
                extract: summary.extract,
                url: summary.content_urls?.desktop?.page || `https://${sub}.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
                badge: 'wikiFallbackArtist'
              };
            }
          }
        }
      }

      // 2. Broad fallback search
      const artistQuery = `"${cArtist}" band OR singer OR musician OR group`;
      const artistSearchUrl = `https://${sub}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(artistQuery)}&format=json&origin=*&srlimit=50`;
      const artistSearchRes = await fetch(artistSearchUrl).then(r => r.json());
      
      if (artistSearchRes.query?.search && Array.isArray(artistSearchRes.query.search)) {
        for (const page of artistSearchRes.query.search) {
          if (page.title.includes('(') && !isArtistPage(page.title)) continue;
          if (isValidMatch(cArtist, page.title)) {
            const summaryUrl = `https://${sub}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(page.title)}`;
            const summary = await fetch(summaryUrl).then(r => r.json());
            if (summary.type === 'disambiguation') continue;
            if (summary.extract) {
              return {
                extract: summary.extract,
                url: summary.content_urls?.desktop?.page || `https://${sub}.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
                badge: 'wikiFallbackArtist'
              };
            }
          }
        }
      }
    } catch (error) {
      console.warn(`Wikipedia artist summary fetch failed for ${sub}:`, error);
    }
    return null;
  };

  // Run level-by-level search across primary and secondary subdomains:
  // 1. Try Song search
  let res = await trySong(primarySub);
  if (res) { wikiCache.set(cacheKey, res); return res; }
  res = await trySong(secondarySub);
  if (res) { wikiCache.set(cacheKey, res); return res; }

  // 2. Try Album search
  res = await tryAlbum(primarySub);
  if (res) { wikiCache.set(cacheKey, res); return res; }
  res = await tryAlbum(secondarySub);
  if (res) { wikiCache.set(cacheKey, res); return res; }

  // 3. Try Artist search
  res = await tryArtist(primarySub);
  if (res) { wikiCache.set(cacheKey, res); return res; }
  res = await tryArtist(secondarySub);
  if (res) { wikiCache.set(cacheKey, res); return res; }

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

  // NOTE: This helper is used exclusively for Genius.com slug generation.
  // EXPERIMENTAL: The hardcoded mappings below are temporary workarounds for key NDW metadata mismatches.
  // WARNING: Do NOT use this as a general pattern for resolving metadata discrepancies. 
  // Maintaining a hardcoded list of exceptions is not scalable.
  const cleanArtistForGenius = (str: string): string => {
    if (!str) return '';
    let cleaned = str.replace(/\s+(feat|ft)\.?\s+.*$/gi, '').trim();
    const lower = cleaned.toLowerCase();
    
    // Hardcoded exceptions for specific database spelling mismatches between Deezer and Genius.
    // (Experimental only - do not add further general exceptions here).
    if (lower === 'clowns & helden') {
      return 'Clowns und Helden';
    }
    if (lower === 'die doraus und die marinas' || lower === 'die doraus & die marinas' || lower === 'andreas dorau & die marinas') {
      return 'Die Doraus & Die Marinas';
    }
    if (lower === 'spliff') {
      return 'Spliff (DEU)';
    }
    if (lower === 'döf' || lower === 'doef') {
      return 'DÖF (AUT)';
    }
    if (lower === 'r.e.m.' || lower === 'rem') {
      return 'R-E-M';
    }
    return cleaned;
  };

  const cleanA = cleanStr(cleanArtistForGenius(artist));
  const cleanT = cleanStr(cleanTitle(title));

  return `https://genius.com/${cleanA}-${cleanT}-lyrics`;
};
