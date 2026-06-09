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
   - **Query Formulation**: The query uses the Lucene search syntax to fetch matching recordings. It generates multiple spelling variations (using `generateTitleVariations` to handle straight vs. curly apostrophes and trailing possessive/plural 's') and queries them as strict double-quoted recording phrases joined by `OR`:
     `artist:"${cleanLuceneQuery(cleanArtist)}" AND (recording:"${cleanLuceneQuery(var1)}" OR recording:"${cleanLuceneQuery(var2)}" OR ...)`
     - Grouping spelling variations inside strict double quotes prevents query token-splitting (which causes OR-pollution matching unrelated songs) and guarantees precise matches.
     - A helper `cleanLuceneQuery` strips Lucene special characters (`+ - & | ! ( ) { } [ ] ^ " ~ * ? : \ /`) to prevent 400 Bad Request query parse errors, while preserving apostrophes and dots to avoid zero-result mismatches.
     - A custom `User-Agent` header (`MelodyMatch/1.0.0 ( frank@example.com )`) is sent with the request to comply with MusicBrainz API usage policies and prevent rate limiting.
   - **Original Release Resolution**: Since duplicates and live releases often score higher than the original single, the query is fetched with `limit=100`. The code scans all returned recording records and selects the minimum `first-release-date` year (e.g., 1958 for *Johnny B. Goode*, 1975 for *Bohemian Rhapsody*).
   - If MusicBrainz resolves a year successfully (validated to be between 1900 and current calendar year + 2), it returns it immediately.

2. **Fallback Year Source: iTunes Search API**:
   If the MusicBrainz lookup fails or returns no valid dates, the app falls back to searching iTunes.
   - **Query Formulation**: Combining the cleaned artist name (stripped of features) and the cleaned song title (e.g. `"Journey Don't Stop Believin'"`).
   - **Proxy Strategy with Candidate Filtering**:
     - **Limit Boost**: The app queries up to 10 tracks (`limit=10`) across all cascading proxies:
       - **Local Dev Proxy**: `/api-itunes/search?...` (used in development)
       - **Local PHP Proxy**: `./proxy.php?...` (used in PHP-enabled hosting environments)
       - **AllOrigins Proxy**: `https://api.allorigins.win/raw?url=...` (free CORS proxy fallback)
     - **Candidate Filtering**: To prevent matching compilation/reissue albums that override the original year, the app normalizes and filters returned tracks against the target title (`cleanAndNormalizeTitle(trackName) === targetNorm`).
     - **Earliest Year Extraction**: Extracts the release year for all valid matching candidates and returns the minimum (earliest) year found.
   - **Date Validation & Regex Extraction (`getYearFromString`)**:
     - If the date is valid, it extracts the year using `getFullYear()`.
     - If date parsing fails or is outside the range `[1900, currentYear + 2]`, it runs a fallback regex `\b(19\d\d|20\d\d)\b` to extract any 4-digit year.

3. **Absolute Fallback: Deezer API**:
   If all MusicBrainz and iTunes methods fail, the app queries `https://api.deezer.com/track/{trackId}` and parses `release_date` as a fallback. If this also fails, the current calendar year is returned as a safe default.

---

## 3. Song Background & Genius Lookup
 
To provide background information about tracks without introducing heavy API key setups or CORS issues, MelodyMatch uses two client-side integrations:
 
1. **Wikipedia Summary API**:
   - **Multi-Level Cascading Search**: To maximize the chance of finding relevant background info, the search cascaded across three hierarchical levels:
     1. **Song-Level**: Queries `"{title}" "{artist}"`.
     2. **Album-Level** (if song fails and album name is known): Queries `intitle:"{albumName}" "{artist}"` or fallback search `"{albumName}" "{artist}" album`.
     3. **Artist-Level** (if song and album fail): Queries `intitle:"{artist}"` or fallback search `"{artist}" band OR singer OR musician OR group`.
   - **Language Cascading**: For each search level, the app first queries the active game language subdomain (e.g. `de.wikipedia.org` if German is selected). If no summary is found, it immediately falls back to search the other language subdomain (e.g. `en.wikipedia.org`). This ensures German-specific bands (like NDW artists) return summaries even when the game is played in English.
   - **Disambiguation & Validation**: To prevent matching wrong pages (such as the band *Ideal* redirecting to the philosophy article *Ideal (Philosophie)*), the app checks for disambiguation types and validates page content descriptions.
   - **Badges**: Standardized translated badges identify what type of information is shown: `wikiFallbackSong` ("Song Info"), `wikiFallbackAlbum` ("Album Info"), and `wikiFallbackArtist` ("Artist Bio").
 
2. **Genius lyrics external linking**:
   - Rather than fetching full lyrics via scraping APIs, the app constructs a Genius.com URL client-side:
     `https://genius.com/{artist}-{title}-lyrics`
   - Slashes, spaces, and punctuation marks are stripped and replaced with hyphens to form the canonical slug.
   - **Ampersand & Conjunction Mapping**: To prevent cutting off bands like "Clowns & Helden" or "Klaus & Klaus", the generator does not truncate at `&` or `,`. 
   - **Database Spelling Mismatches**: Since Genius and Deezer metadata spellings can differ, the app incorporates a dictionary mapping known mismatches (e.g., `"Clowns & Helden"` is mapped to `"Clowns und Helden"`, `"Die Doraus Und Die Marinas"` to `"Die Doraus & Die Marinas"`, `"Spliff"` to `"Spliff (DEU)"`, and `"DöF"` to `"DÖF (AUT)"`). For all other artists, `&` is mapped to `"and"` by default, matching Genius's automatic slugifier. This ensures links work regardless of active game language settings.
     > [!WARNING]
     > **Experimental Feature:** These hardcoded database mappings are temporary workarounds for key NDW tracks. Do NOT expand this list as a general design pattern for other metadata discrepancies, as a hardcoded mapping list is not scalable.
