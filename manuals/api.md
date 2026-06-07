# MelodyMatch API Manual

## Overview
MelodyMatch fetches music metadata and audio previews primarily utilizing the **Deezer API**. To ensure seamless compatibility and bypass CORS blocks directly in the browser (especially on iOS Safari), the application uses client-side **JSONP** requests (`output=jsonp`). 

To obtain original release years (rather than compilation release dates), the app performs an on-the-fly query to the **iTunes Search API** when a player starts their turn.

---

## 1. Initial Song Pool Fetch

When the user configures the game and clicks "Start Game", the application gathers the selected genres and calls `fetchSongs(count, genres)`:

1. **Charts vs. Specific Genres**:
   - If **Charts** (key: `'all'`) is selected, it queries Deezer's global charts:
     `https://api.deezer.com/chart/0/tracks?limit=300`
   - If a main genre (e.g., *Pop*, *Rock*, *Heavy Metal*) is selected, it queries the genre-specific chart using `GENRE_MAP`:
     `https://api.deezer.com/chart/{genreId}/tracks?limit=300`
   - If a sub-genre (e.g., *Schlager*, *NDW*, *Indie*, *New Wave / Post-Punk*) is selected, it maps it to curated editorial playlist IDs in `PLAYLIST_MAP` (supporting single IDs or arrays of IDs) and queries the playlist tracklists:
     `https://api.deezer.com/playlist/{playlistId}/tracks?limit=300`
   - If no map matches, it falls back to a standard text search query:
     `https://api.deezer.com/search?q={term}&limit=300`

2. **JSONP Fetcher (`fetchDeezerJsonp`)**:
   Deezer allows script-based callbacks by appending `output=jsonp&callback=...` to the URL. The app dynamically appends a `<script>` tag to the document, registers a unique window callback, and resolves the promise when the script executes, bypassing CORS.

3. **Title Sanitization (`cleanSongTitle`)**:
   Before placing songs in the pool, their titles are globally sanitized to strip out cluttering remastered, live, or version suffixes like `(Remastered)`, `(2001 Remaster)`, `[Live]`, or `(Rerecorded)`. This ensures that:
   - Clean titles are shown in the UI.
   - Clean titles are used to generate wrong answers in multiple-choice grids.
   - iTunes queries are clean and match original releases.

4. **Deduplication & Shuffle**:
   Tracks are normalized to an alphanumeric title-artist key to discard duplicates (e.g. from overlapping genre charts). The remaining tracks are shuffled and sliced to the requested pool size (e.g. 100).

---

## 2. On-the-Fly Year Lookup

During the transition from the `PASS_DEVICE` screen to the `QUIZ` screen, the application performs an asynchronous fetch using `fetchTrackYear(trackId, title, artist)` to find the original release year:

1. **Query Formulation**:
   The query is formed by combining the cleaned artist name (stripped of features) and the cleaned song title (e.g. `"Journey Don't Stop Believin'"`).

2. **Cascading Proxy Strategy**:
   The app tries the following endpoints in order:
   - **Local Dev Proxy**: `/api-itunes/search?...` (used in development)
   - **Local PHP Proxy**: `./proxy.php?...` (used in PHP-enabled hosting environments)
   - **AllOrigins Proxy**: `https://api.allorigins.win/raw?url=...` (free CORS proxy fallback)
   - **Deezer Fallback**: `https://api.deezer.com/track/{trackId}` (metadata lookup if iTunes search fails)

3. **Date Validation & Regex Extraction (`getYearFromString`)**:
   To prevent `"NaN"` or invalid years, the returned string is parsed:
   - If the date is valid, it extracts the year using `getFullYear()`.
   - If date parsing fails or is outside the range `[1900, currentYear + 2]`, it runs a fallback regex `\b(19\d\d|20\d\d)\b` to extract any 4-digit year.
   - If all lookups fail, it returns the current calendar year as a safe fallback.
