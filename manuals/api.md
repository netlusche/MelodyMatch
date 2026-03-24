# MelodyMatch API Manual

## Overview
MelodyMatch fetches music metadata and audio previews utilizing the **iTunes Search API**. To ensure high reliability across all platforms—especially iOS Safari, which natively intercepts iTunes links—requests are dynamically routed through fallback CORS proxies if the native browser fetch fails.

## The Genre Selection Payload
After the user finishes configuring the game on the `GenreScreen`, a string array of selected genres is gathered.

1. **User Selection**: The user selects one or multiple genres (e.g., `["pop", "rock", "heavy metal"]`).
2. **"All Genres" Rule**: If the selection includes "All Genres" (or is completely empty), the application defaults to a single, randomly chosen broad term from a hardcoded list (e.g., `'party'`, `'90s'`, `'chart hits'`).
3. **Dispatch**: The final array of genre string terms is passed to the `fetchSongs(count, genres)` function. The `count` is heavily padded (e.g., requesting `100` tracks) regardless of the actual game length, guaranteeing a massive variety pool to generate realistic multiple-choice trivia answers later on.

## How the API Processes the Request

Inside `src/services/api.ts`, the frontend executes the following process for **each** genre term in the payload array:

### 1. Primary Query Formulation
For each term, it constructs an iTunes API request targeting the `genreTerm` attribute, fetching a maximum of 200 tracks per search to cast a wide net:
`https://itunes.apple.com/search?term={GENRE_TERM}&attribute=genreTerm&media=music&limit=200`

### 2. Network Proxy Redundancy
Because the device might reject the native `fetch` (due to CORS policies or Apple Music deep-linking intercepts on iPhones), the request is layered:
- **Native Fetch**: Tried first.
- **Proxy 1**: `api.codetabs.com` (strips User-Agent to bypass Apple Music redirects)
- **Proxy 2**: `corsproxy.io` (standard fallback)
If the first fails, it silently cascades to the next.

### 3. Broad Match Fallback
If the network request successfully returns, but the payload has `0` results (which happens because iTunes may not strictly classify query strings like "2000s hits" or "Partyhits" as an official `genreTerm`), the API drops the `attribute=genreTerm` modifier entirely. It then fires a second network request using a standard, global text search for that term across the music database.

### 4. Aggregation and Deduplication
The arrays from all successful genre queries are flattened into a single massive unrefined list.
The `api.ts` service then forcefully sanitizes the list:
- **Filtering**: Tracks missing critical data (preview audio, artwork, or valid release dates) are discarded.
- **Deduplication**: The service normalizes the track titles and artist names into string keys (e.g., removing special characters and cases). It uses a `Set` matching algorithm to actively reject any track that shares the same Title/Artist key. This eliminates duplicates caused by genre overlaps, remasters, or "Greatest Hits" compilations.

### 5. Data Mapping
The valid, unique tracks are shuffled randomly. The finalized pool is trimmed to exactly the requested `count` (100).
Finally, the chaotic iTunes JSON payload is mapped securely into the application's clean TypeScript `Song` format:
- It isolates only the year from the full `releaseDate` ISO string.
- It dynamically modifies the `artworkUrl100` string (replacing `100x100bb` with `600x600bb`) to force iTunes to return high-resolution 600px album covers.
- The `Song[]` array is returned to the state manager and the game begins.
