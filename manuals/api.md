# MelodyMatch API Manual

## Overview
MelodyMatch fetches music metadata and audio previews primarily utilizing the **Deezer API**. To ensure seamless compatibility and bypass CORS blocks directly in the browser (especially on iOS Safari), the application uses client-side **JSONP** requests (`output=jsonp`). 

To obtain original release years (rather than compilation release dates), the app performs an on-the-fly query to the **MusicBrainz API** as the primary source, and cascades to the **iTunes Search API** and **Deezer API** when a player starts their turn.

---

## 1. Initial Song Pool Fetch

When the user configures the game and clicks "Start Game", the required song pool size is calculated dynamically based on player count and rounds: `Math.max(100, state.players.length * state.totalRounds + 10)`. The application gathers the selected genres/decades and calls `fetchSongs(count, genres)`:

1. **Charts vs. Specific Genres/Decades**:
   - If **Charts** (key: `'all'`) is selected, it queries Deezer's global charts:
     `https://api.deezer.com/chart/0/tracks?limit=300`
   - If a main genre (e.g., *Pop*, *Rock*, *Heavy Metal*) is selected, it queries the genre-specific chart using `GENRE_MAP`:
     `https://api.deezer.com/chart/{genreId}/tracks?limit=300`
   - If a sub-genre (e.g., *Schlager*, *NDW*, *Indie*) or a decade (e.g., *50s*, *60s*, *70s*, *80s*, *90s*, *2000+*) is selected, it maps it to multiple curated editorial and official playlist IDs in `PLAYLIST_MAP`.
   - **Parallel Fetching**: The tracklists for all mapped playlist IDs are fetched in parallel using `Promise.all` to optimize loading times:
     `https://api.deezer.com/playlist/{playlistId}/tracks?limit=300`
   - If no map matches, it falls back to a standard text search query:
     `https://api.deezer.com/search?q={term}&limit=300`
   - **Top Charts Fallback**: If the total count of deduplicated unique songs is less than the requested `count`, the app automatically queries Deezer's global top charts (`/chart/0/tracks?limit=300`) to fill the remaining slots.

2. **JSONP Fetcher (`fetchDeezerJsonp`)**:
   Deezer allows script-based callbacks by appending `output=jsonp&callback=...` to the URL. The app dynamically appends a `<script>` tag to the document, registers a unique window callback, and resolves the promise when the script executes, bypassing CORS.

3. **Title Sanitization (`cleanSongTitle`)**:
   Before placing songs in the pool, their titles are globally sanitized to strip out cluttering remastered, live, or version suffixes like `(Remastered)`, `(2001 Remaster)`, `[Live]`, or `(Rerecorded)`. This ensures that:
   - Clean titles are shown in the UI.
   - Clean titles are used to generate wrong answers in multiple-choice grids.
   - External queries are clean and match original releases.

4. **Deduplication & Shuffle**:
   Tracks are normalized to an alphanumeric title-artist key to discard duplicates (e.g. from overlapping genre charts). The remaining tracks are shuffled using an unbiased **Fisher-Yates shuffle** algorithm (`shuffleArray`) to ensure a completely uniform distribution, preventing any single selected genre from dominating the final sliced song pool (e.g., 100 songs).

5. **Audio Play (Hörspiel) Filtering**:
   German audio dramas (*Die drei ???*, *Bibi Blocksberg*, *TKKG*, *Benjamin Blümchen*, etc.) frequently flood German Deezer charts. To ensure the trivia pool only contains musical tracks, `filterAndDeduplicate` checks track titles and artist names against a case-insensitive blacklist:
   `die drei ???`, `die drei !!!`, `bibi blocksberg`, `tkkg`, `benjamin blümchen`, `hörspiel`, `folge`, `kapitel`, `teufelsberg`, `weihnachtsspiel`.
   Any matching tracks are discarded immediately.

---

## 2. On-the-Fly Year Lookup

During the transition from the `PASS_DEVICE` screen to the `QUIZ` screen, the application performs an asynchronous fetch using `fetchTrackYear(trackId, title, artist)` to find the original release year:

1. **Primary Year Source: MusicBrainz API**:
   - **Query Formulation**: The query uses the Lucene search syntax to fetch matching recordings:
     `artist:"${cleanLuceneQuery(cleanArtist)}" AND recording:"${cleanLuceneQuery(cleanTitle)}"`
     - A helper `cleanLuceneQuery` strips Lucene special characters (`+ - & | ! ( ) { } [ ] ^ " ~ * ? : \ /`) to prevent 400 Bad Request query parse errors, while preserving apostrophes and dots to avoid zero-result mismatches.
   - **Original Release Resolution**: Since duplicates and live releases often score higher than the original single, the query is fetched with `limit=100`. The code scans all returned recording records and selects the minimum `first-release-date` year (e.g., 1958 for *Johnny B. Goode*, 1975 for *Bohemian Rhapsody*).
   - If MusicBrainz resolves a year successfully (validated to be between 1900 and current calendar year + 2), it returns it immediately.

2. **Fallback Year Source: iTunes Search API**:
   If the MusicBrainz lookup fails or returns no valid dates, the app falls back to searching iTunes.
   - **Query Formulation**: Combining the cleaned artist name (stripped of features) and the cleaned song title (e.g. `"Journey Don't Stop Believin'"`).
   - **Cascading Proxy Strategy**:
     - **Local Dev Proxy**: `/api-itunes/search?...` (used in development)
     - **Local PHP Proxy**: `./proxy.php?...` (used in PHP-enabled hosting environments)
     - **AllOrigins Proxy**: `https://api.allorigins.win/raw?url=...` (free CORS proxy fallback)
   - **Date Validation & Regex Extraction (`getYearFromString`)**:
     - If the date is valid, it extracts the year using `getFullYear()`.
     - If date parsing fails or is outside the range `[1900, currentYear + 2]`, it runs a fallback regex `\b(19\d\d|20\d\d)\b` to extract any 4-digit year.

3. **Absolute Fallback: Deezer API**:
   If all MusicBrainz and iTunes methods fail, the app queries `https://api.deezer.com/track/{trackId}` and parses `release_date` as a fallback. If this also fails, the current calendar year is returned as a safe default.

---

## 3. Song Background & Genius Lookup

To provide background information about tracks without introducing heavy API key setups or CORS issues, MelodyMatch uses two client-side integrations:

1. **Wikipedia Summary API**:
   - **Step 1: Search Wikipedia**: The app first queries the Wikipedia search endpoint:
     `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch="{title}" "{artist}"&format=json&origin=*`
   - **Step 2: Fetch Article Summary**: If a search result is found, it fetches the clean text summary:
     `https://en.wikipedia.org/api/rest_v1/page/summary/{pageTitle}`
   - **Fallback Strategy**: If no song-specific page exists, the search repeats using the artist query (`"{artist}" band OR singer OR musician OR group`) to pull up the artist's biography.
   - **Localizations**: Standard badges `wikiFallbackSong` ("Song Info" / "Song-Info") and `wikiFallbackArtist` ("Artist Bio" / "Interpret-Info") are translated inline.

2. **Genius lyrics external linking**:
   - Rather than fetching full lyrics via unreliable or slow scraping APIs, the app constructs a Genius.com URL client-side:
     `https://genius.com/{artist}-{title}-lyrics`
   - Slashes, spaces, and punctuation marks are stripped and replaced with hyphens to form the canonical slug, allowing users to read full lyrics and crowd-sourced song meanings on Genius.
