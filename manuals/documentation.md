# MelodyMatch — System Documentation

## Table of Contents

1. [Overview](#1-overview)
2. [Tech Stack & Project Structure](#2-tech-stack--project-structure)
3. [State Management](#3-state-management)
4. [Game Flow](#4-game-flow)
5. [Audio System](#5-audio-system)
6. [Song Pool & Genre System](#6-song-pool--genre-system)
7. [Release Year Lookup](#7-release-year-lookup)
8. [Song Info: Wikipedia & Genius](#8-song-info-wikipedia--genius)
9. [Liked Songs & Player Modals](#9-liked-songs--player-modals)
10. [UI Components](#10-ui-components)
11. [Themes & Canvas Animations](#11-themes--canvas-animations)
12. [Localization](#12-localization)
13. [PWA](#13-pwa)
14. [Build & Deployment](#14-build--deployment)
15. [Known Design Decisions & Constraints](#15-known-design-decisions--constraints)

---

## 1. Overview

MelodyMatch is a **local multiplayer music quiz** — one device, passed between players. No account required, no backend. Players guess the title, artist, and release year of 30-second song previews fetched live from Deezer. The app is installable as a PWA on iOS and Android directly from the browser.

The application is a pure **static single-page app**: all API calls are made directly from the browser using JSONP (Deezer) or public REST endpoints (MusicBrainz, Wikipedia). The only optional server-side component is a thin PHP proxy for iTunes year lookups on PHP-enabled hosting.

---

## 2. Tech Stack & Project Structure

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite 5 |
| Styling | Pure CSS (`src/styles.css`) — no CSS framework |
| Icons | lucide-react |
| Confetti | canvas-confetti |
| State | React `useReducer` + Context |
| Persistence | `localStorage` |
| APIs | Deezer (JSONP), MusicBrainz, iTunes, Wikipedia, Genius (URL only) |
| PWA | vite-plugin-pwa + Workbox |

### Directory Structure

```
src/
├── App.tsx                    # Root component, phase router
├── main.tsx                   # React entry point
├── styles.css                 # Global styles, themes, animations
├── types/
│   └── index.ts               # Shared TypeScript types (Song, Player, GameState, ...)
├── state/
│   ├── GameContext.tsx         # Context provider, localStorage sync
│   └── gameReducer.ts         # Pure reducer + initialState + GameAction types
├── services/
│   ├── api.ts                  # Deezer JSONP, GENRE_MAP, PLAYLIST_MAP, year lookup
│   ├── audio.ts                # AudioManager singleton (iOS unlock, playback)
│   └── infoService.ts          # Wikipedia cascade, Genius URL generation
├── components/
│   ├── BackgroundEffects.tsx   # Canvas animation loop (theme-specific)
│   ├── SetupScreen.tsx         # Player setup, genre selection entry, liked songs
│   ├── GenreScreen.tsx         # Genre/decade multi-select
│   ├── PassDeviceScreen.tsx    # Pass-the-device interstitial, year pre-fetch
│   ├── QuizScreen.tsx          # Active quiz: audio playback, answer grid
│   ├── TurnResultScreen.tsx    # Per-turn score summary
│   ├── FinalResultsScreen.tsx  # Winner screen, full round history
│   ├── FavoritesModal.tsx      # Liked Songs player modal
│   ├── RoundReplayModal.tsx    # Round Replay player modal
│   ├── TrackInfoModal.tsx      # Wikipedia summary + Genius link modal
│   └── PlaylistExportModal.tsx # Export liked songs as .m3u / .csv / text
├── i18n/
│   └── translations.ts         # EN + DE translation strings
└── utils/
    ├── arrayUtils.ts            # Fisher-Yates shuffle
    ├── confettiColors.ts        # Per-theme confetti color sets
    ├── favorites.ts             # localStorage read/write for liked songs
    └── stringUtils.ts           # cleanAndNormalizeTitle, title variation helpers
```

---

## 3. State Management

### GameState

Defined in `src/types/index.ts`. The full state shape:

```typescript
interface GameState {
  lang: Language;               // 'en' | 'de'
  theme: Theme;                 // one of 14 theme keys
  players: Player[];
  currentPlayerIndex: number;
  currentRound: number;
  totalRounds: number;
  phase: GamePhase;             // 'SETUP' | 'GENRE_SELECTION' | 'PASS_DEVICE' | 'QUIZ' | 'TURN_RESULT' | 'FINAL_RESULTS'
  songPool: Song[];
  currentSong: Song | null;
  currentStep: QuestionStep;    // 'TITLE' | 'ARTIST' | 'YEAR'
  turnPoints: number;
  turnResults: { title: number; artist: number; year: number };
  history: PlayedSong[];
  genres: string[];
}
```

### Reducer

`src/state/gameReducer.ts` — a pure function with no side effects. Notable actions:

| Action | Trigger |
|---|---|
| `CONTINUE_TO_GENRES` | Player setup confirmed |
| `START_GAME` | Genres confirmed, pool fetch begins |
| `SET_SONG_POOL` | Pool fetch completed |
| `BEGIN_TURN` | Player clicks "Begin Turn" (anchors audio unlock) |
| `ANSWER_STEP` | Player selects an answer |
| `NEXT_STEP` | Advance TITLE → ARTIST → YEAR |
| `END_TURN` | Turn completed, score added to history |
| `NEXT_TURN` | Advance to next player/round |
| `UPDATE_SONG_YEAR` | Year lookup result arrives asynchronously |
| `PLAY_AGAIN` | Reset game, keep players and settings |
| `SET_THEME` | Theme changed from dropdown |

### Context & localStorage Sync

`src/state/GameContext.tsx` wraps the reducer in a React Context. State is persisted to `localStorage` via a debounced `useEffect` (300ms delay) to avoid blocking the main thread on rapid state transitions:

```typescript
useEffect(() => {
  const timer = setTimeout(() => saveGameState(state), 300);
  return () => clearTimeout(timer);
}, [state]);
```

On mount, the stored state is rehydrated. This allows the game to survive accidental page refreshes mid-round.

---

## 4. Game Flow

```
SETUP → GENRE_SELECTION → PASS_DEVICE → QUIZ → TURN_RESULT → [next player...]
                                                              → FINAL_RESULTS
```

- **SETUP**: Players add their names, set round count and language. Liked Songs are displayed here.
- **GENRE_SELECTION**: One or more genres/decades are selected. Confirming triggers `fetchSongs()` in the background.
- **PASS_DEVICE**: Device is passed to the active player. Year pre-fetch (`fetchTrackYear`) runs asynchronously during this screen.
- **QUIZ**: Audio plays. Three sequential steps (TITLE, ARTIST, YEAR) with multiple-choice grids and a 30-second timer.
- **TURN_RESULT**: Score breakdown for the completed turn.
- **FINAL_RESULTS**: Leaderboard, full played-songs history, Round Replay Player modal.

---

## 5. Audio System

`src/services/audio.ts` — singleton `AudioManager` class, exported as `audioManager`.

### iOS Safari Autoplay Problem

iOS Safari blocks `audio.play()` unless it is called **synchronously within a user gesture** (tap/click). If the play promise is not anchored to the gesture, it rejects with `NotAllowedError`.

### Solution: Silent WAV + Gesture Anchoring

When any user interaction is detected (touch, click, keydown), `AudioManager` plays a 1-byte silent WAV data URI. This "unlocks" the audio element and sets `isUnlocked = true`. From that point, `playSong()` calls succeed without requiring a new gesture.

`BEGIN_TURN` dispatches immediately on the "Begin Turn" button click — the audio play call sits inside that synchronous gesture handler, ensuring it is always anchored.

### NotAllowedError vs. Resource Errors

A critical distinction in `playSong()`:

```typescript
return audio.play().catch(err => {
  if (err.name === 'NotAllowedError') {
    // Autoplay policy block — re-register unlock listeners
    this.isUnlocked = false;
    this.registerUnlockListeners();
  } else {
    // Broken URL or network error — do NOT reset unlock state
    console.warn("Playback failed (resource/network error):", err);
  }
  throw err;
});
```

Before this fix, any failed `play()` call — including a broken preview URL — would reset `isUnlocked = false`, permanently locking audio until the next user gesture. The error type check prevents this deadlock.

---

## 6. Song Pool & Genre System

See **[api.md — Section 1](api.md#1-initial-song-pool-fetch)** for the full reference, including GENRE_MAP, PLAYLIST_MAP tables, JSONP fetcher, deduplication, Fisher-Yates shuffle, and Hörspiel filtering.

**Summary:**

- `GENRE_MAP`: Maps a genre key to a Deezer genre ID → queries the live chart endpoint. Only used for `hip-hop` and `heavy metal` where chart quality is reliable.
- `PLAYLIST_MAP`: Maps a genre/decade key to one or more Deezer editorial playlist IDs. Fetched in parallel via `Promise.all`. Used for Rock, Pop, Electronic, R&B, Alternative, and all German genres and decades.
- Pool size: `Math.max(100, players × rounds + 10)`. If the deduplicated result is smaller, the global top chart fills the gap.

---

## 7. Release Year Lookup

See **[api.md — Section 2](api.md#2-on-the-fly-year-lookup)** for the full cascade logic.

**Summary:** MusicBrainz (earliest `first-release-date` across 100 results) → iTunes (via proxy cascade, minimum year across filtered candidates) → Deezer track metadata (last resort). The lookup runs asynchronously during `PASS_DEVICE` and updates state via `UPDATE_SONG_YEAR` when it resolves.

---

## 8. Song Info: Wikipedia & Genius

See **[api.md — Section 3](api.md#3-song-background--genius-lookup)** for the full Wikipedia cascade logic and Genius slug generation details.

### Wikipedia In-Memory Cache

`src/services/infoService.ts` maintains a module-level `Map<string, WikiResult>` keyed by `title|artist|lang`. Opening Song Info for the same song a second time (e.g. in both FavoritesModal and FinalResultsScreen) returns immediately from cache — no network requests.

```typescript
const cacheKey = `${cTitle}|${cArtist}|${lang}`;
if (wikiCache.has(cacheKey)) return wikiCache.get(cacheKey)!;
```

Only successful results are cached. A network failure or `null` result is not stored, so a subsequent open will retry.

### Genius URL Generation

Slugs are constructed deterministically client-side: lowercase, `&` → `and`, punctuation stripped, spaces/slashes → `-`. Special cases handled via a small hardcoded mapping in `cleanArtistForGenius`:

| Deezer name | Genius slug name | Reason |
|---|---|---|
| `Clowns & Helden` | `Clowns und Helden` | Deezer/Genius spelling mismatch |
| `Die Doraus & Die Marinas` | `Die Doraus & Die Marinas` | Canonical Genius spelling |
| `Spliff` | `Spliff (DEU)` | Disambiguation on Genius |
| `DÖF` / `Doef` | `DÖF (AUT)` | Disambiguation on Genius |
| `R.E.M.` / `rem` | `R-E-M` | Dots stripped → slug `r-e-m-song-lyrics` |

> **Warning:** These mappings are intentional exceptions for known NDW/classic artists. Do not use this pattern as a general solution for metadata discrepancies — the list is not designed to scale.

### isMounted Guard

`TrackInfoModal` sets a local `isMounted` flag in its `useEffect` cleanup. This prevents stale `setState` calls if the modal is closed before the Wikipedia fetch resolves.

---

## 9. Liked Songs & Player Modals

### Persistence

Liked songs are stored in `localStorage` via `src/utils/favorites.ts` (`addFavorite`, `removeFavorite`, `getFavorites`). They persist across sessions and game resets.

### Preview URL Refresh

Deezer CDN preview URLs expire after ~1–2 hours. Songs stored in `localStorage` (Liked Songs) or in round history therefore fail to play after some time — most visibly on iOS Safari. Both `FavoritesModal` and `RoundReplayModal` call `refreshPreviewUrls()` on mount to silently re-fetch fresh URLs for all songs in parallel before the user taps anything. See [api.md — Section 3](api.md#3-preview-url-refresh) for details.

### FavoritesModal (`src/components/FavoritesModal.tsx`)

Opened via the **Player** button on the Setup screen (visible as soon as ≥1 song is liked). Features:

- Spinning vinyl turntable at the top: idle disc placeholder, album cover fades in smoothly (`favCoverFadeIn` keyframe) when a song is selected from the list.
- Full list with play/pause, info (opens `TrackInfoModal` stacked on top — does **not** close the Player modal), remove button.
- Export Playlist button (opens `PlaylistExportModal`).

### RoundReplayModal (`src/components/RoundReplayModal.tsx`)

Opened via the **Player** button on the Final Results screen. Same turntable design. Shows all songs from the completed round with `playedBy` player name and points breakdown per song. Heart/fav toggle instead of delete button.

### Modal Stacking

Both player modals render `TrackInfoModal` internally when a song's info icon is clicked — the info modal stacks on top of the player modal without closing it. This avoids the earlier bug where opening Song Info from SetupScreen would close the Player modal first.

---

## 10. UI Components

### Screen Components

| Component | Phase | Description |
|---|---|---|
| `SetupScreen` | SETUP | Player names, round count, language, liked songs list |
| `GenreScreen` | GENRE_SELECTION | Multi-select genre/decade tiles |
| `PassDeviceScreen` | PASS_DEVICE | Pass-the-device interstitial, year lookup runs here |
| `QuizScreen` | QUIZ | Audio playback, answer grid, timer, blur mode |
| `TurnResultScreen` | TURN_RESULT | Per-turn score breakdown |
| `FinalResultsScreen` | FINAL_RESULTS | Leaderboard, history, confetti |

`App.tsx` routes between screens based on `state.phase`.

### Answer Grid & Blur Mode

`QuizScreen` renders a multiple-choice grid with 4 options. In TITLE and ARTIST steps, answer text is blurred until the player actively reveals them (to prevent accidental spoilers when passing the device). In YEAR step, answers are never blurred.

### Double-Tap Protection

State transition buttons (Begin Turn, Submit Answer) use a local `isTransitioning` boolean set to `true` on first click. Subsequent clicks within the same render cycle are ignored, preventing double-dispatch on rapid taps.

---

## 11. Themes & Canvas Animations

### Theme System

14 themes are defined as CSS class names applied to `document.body`. Each theme sets a collection of CSS custom properties:

```css
body.theme-sakura {
  --bg: #fff0f5;
  --primary: #e75480;
  --card: #fff5f8;
  /* ... */
}
```

Themes are persisted in `GameState.theme` and survive page reloads.

### Canvas Background (`src/components/BackgroundEffects.tsx`)

A full-screen `<canvas>` element is rendered behind all UI. Each theme has its own `requestAnimationFrame` draw loop:

| Theme | Effect |
|---|---|
| `default` | Neon floating particles |
| `matrix` | Green falling code characters |
| `kraftwerk` | Animated bar graph equalizer |
| `sakura` | Falling cherry blossoms |
| `frutiger_aero` | Rising bubble particles |
| `post_punk` | Animated scan lines |
| `heavy_metal` | Fire ember particles |
| `synthwave` | Grid perspective lines |
| *(others)* | Subtle particle or static effects |

**Performance notes:**
- `Date.now()` for time-based animations is called once per frame before the draw loop, not inside per-element iterations.
- All loops check `window.matchMedia('(prefers-reduced-motion: reduce)')` and skip animation if set.
- The resize listener uses a function reference defined inside `useEffect`, so cleanup always removes the correct handler — no memory leak on theme switch.

---

## 12. Localization

`src/i18n/translations.ts` exports a `translations` object with `en` and `de` keys. Every UI string is looked up via `t[key]`, where `t = translations[state.lang]`.

Language is set once during player setup and stored in `GameState.lang`. Changing language mid-game is not supported (it would require pool re-fetch).

**Wikipedia language fallback:** When fetching song info, the active game language is tried first (`de.wikipedia.org` for German, `en.wikipedia.org` for English). If no result is found, the other language is tried automatically. This ensures German NDW artists — which often have German-only Wikipedia pages — still return summaries when the game is played in English.

---

## 13. PWA

MelodyMatch is a fully installable Progressive Web App, implemented with `vite-plugin-pwa` and Workbox.

### Manifest

`dist/manifest.webmanifest` is auto-generated from `vite.config.ts`. Key settings:

| Field | Value |
|---|---|
| `name` | MelodyMatch |
| `display` | `standalone` (no browser chrome when installed) |
| `orientation` | `portrait` |
| `theme_color` | `#6366f1` (Indigo — matches Default theme) |
| `background_color` | `#0f0f1a` (matches default dark background) |
| `start_url` | `.` |

### Icons

Three icon files in `public/` (and `dist/` after build), all derived from `og-image.png`:

| File | Size | Purpose |
|---|---|---|
| `pwa-192.png` | 192×192 | Standard Android home screen icon |
| `pwa-512.png` | 512×512 | Splash screen, high-res displays |
| `pwa-maskable-512.png` | 512×512 | Android adaptive icon (safe-area masked) |

### Caching Strategy (Workbox)

| Resource | Strategy | Details |
|---|---|---|
| App shell (JS, CSS, HTML, fonts) | Precache | All assets cached at install time, served offline |
| Deezer album artwork (`e-cdns-images.dzcdn.net`) | `CacheFirst` | Max 100 entries, 7-day expiry |
| Deezer API / audio previews | No cache | Dynamic JSONP, external domain |
| Wikipedia / MusicBrainz / iTunes | No cache | Dynamic, already covered by in-memory cache |

The Service Worker is registered with `registerType: 'autoUpdate'` — when a new version is deployed, the SW updates automatically in the background on the next page load.

### Installation

- **iOS**: Safari → Share → "Add to Home Screen"
- **Android / Desktop Chrome**: Install button in the address bar, or browser menu → "Install app"

The Service Worker is **not active in development** (`npm run dev`). To test PWA functionality locally, use the production build:

```bash
npm run build && npx vite preview
```

---

## 14. Build & Deployment


### Development

```bash
npm install
npm run dev        # Vite dev server at http://localhost:5173
```

The Vite dev server includes a proxy rule that forwards `/api-itunes/*` to the iTunes Search API, bypassing CORS for year lookups during development.

### Production Build

```bash
npm run build      # TypeScript check + Vite bundle → dist/
```

The output in `dist/` is a fully static bundle. No server required for core functionality — Deezer fetches use client-side JSONP which bypasses CORS entirely.

### Proxy Strategy for iTunes Year Lookups

iTunes does not support JSONP, so year lookups require one of three proxy paths:

| Environment | Proxy method |
|---|---|
| Local dev | Vite `/api-itunes` proxy rule in `vite.config.ts` |
| PHP hosting (e.g. Strato) | `proxy.php` bundled in `dist/` |
| Vercel / Netlify | Rewrite rules in `vercel.json` / `_redirects` |
| Purely static hosting | AllOrigins CORS proxy (`api.allorigins.win`) |

The fallback chain is tried in order until one succeeds. If all proxies fail, MusicBrainz or Deezer metadata covers the year lookup.

### Versioning

Semantic versioning without `v` prefix (e.g. `0.5.0`, not `v0.5.0`), matching the existing git tag convention. Version is set in `package.json` and surfaced in the bundle. **Always confirm with the project owner before bumping the version number.**

---

## 15. Known Design Decisions & Constraints

### No Backend

All data flows directly from browser to public APIs. This is intentional: the app can be deployed to any static host with zero configuration. The trade-off is that sensitive operations (API keys, server-side caching) are not possible.

### JSONP for Deezer

Deezer's public API does not include CORS headers for browser requests. Rather than routing all Deezer calls through a proxy, the app uses client-side JSONP (`output=jsonp&callback=...`) by dynamically injecting `<script>` tags. This is the standard pattern for Deezer's public API and avoids any backend dependency for the core music data.

### Genius Links are Best-Effort

Genius URLs are generated deterministically from artist/title slugs without an API call. This works for the vast majority of tracks but can fail for artists with unusual punctuation in their names. There is no way to verify the URL client-side without a Genius API key. A small hardcoded exception map handles the most important known mismatches (see [Section 8](#8-song-info-wikipedia--genius)).

### Song.year is a String

`Song.year` is typed as `string` (not `number`) throughout the codebase. This is intentional: year values sometimes arrive as partial date strings (e.g. `"1975-01-01"`) and are normalized later. Comparisons and display both work with the string representation.

### history Array Contains Legacy Shapes

`GameState.history` may contain both the new `PlayedSong` shape (`{ song, player, results }`) and legacy direct `Song` objects from earlier versions loaded from `localStorage`. Components that render history use a runtime guard:

```typescript
const song = (entry as any).song ? (entry as any).song : entry;
```

This ensures backwards compatibility with saved games from before the history schema was updated.
