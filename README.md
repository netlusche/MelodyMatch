# 🎵 MelodyMatch

A fast-paced, interactive, modern **local multiplayer music quiz** built with React, Vite, and the Deezer & iTunes APIs. Pass the device, guess the song — no account, no backend, no setup required.

---

## ✨ Features

### 🎮 Gameplay
- **Local Multiplayer**: Pass one device between players — each player gets their own turn to guess title, artist, and release year.
- **Double-Click & Rapid-Tap Protection**: State transition buttons and answer grids are guarded against rapid consecutive taps, preventing accidental step skips or out-of-sync audio.

### 🎧 Music & Audio
- **Direct Music Previews**: Plays 30-second track snippets directly from the **Deezer API** via client-side JSONP (`output=jsonp`) — completely bypasses CORS restrictions without any proxy or backend.
- **Safari Autoplay Unlock**: Synchronously anchors the audio play promise to the user gesture (e.g., clicking "Begin Turn"), ensuring previews play instantly on iOS Safari. A dedicated error-type check (`NotAllowedError` vs. resource errors) prevents permanent audio lockout when preview URLs are broken or unavailable.

### 🗂️ Song Pool & Genre System
- **Curated Playlists for all Genres**: Every genre and decade pulls from multiple hand-picked editorial playlists via `PLAYLIST_MAP` rather than relying on Deezer's genre charts (which can mix in unrelated content). Genre coverage:
  - 🎸 **Rock** — 11 playlists, ~500 unique songs
  - 🎤 **Pop** — 10 playlists, ~500 unique songs
  - 🎛️ **Electronic** — 8 playlists, ~300 unique songs
  - 🎷 **R&B** — 10 playlists, ~300 unique songs
  - 🌀 **Alternative** — 9 playlists, ~300 unique songs
  - 🎸 **Classic Rock**, **Indie**, **New Wave / Post-Punk** — curated playlists
  - 🇩🇪 **NDW**, **Schlager**, **Deutschpop**, **Deutschrock**, **Deutscher Rap**, **Ballermann**, **Partyhits** — curated German playlists
  - 📅 **Decades** (50s → 2000+) — curated decade playlists
  - 📊 **Charts** — Deezer global top hits (live chart, intentionally uncurated)
- **Parallel Fetching**: All playlist IDs for a genre are fetched simultaneously using `Promise.all` for fast pool assembly.
- **Dynamic Pool Sizing & Fallback**: Pool size is calculated as `Math.max(100, players × rounds + 10)`. If the deduplicated result is still smaller, the app fills the gap from Deezer's global top chart automatically.
- **Fisher-Yates Shuffle**: When mixing multiple genres, the combined pool is shuffled with a mathematically unbiased algorithm — no single genre dominates.
- **Hörspiel Filter**: German audio dramas (*Die drei ???*, *Bibi Blocksberg*, *TKKG*, etc.) are filtered out via a title/artist blacklist.

### 📅 Release Year Accuracy
- **MusicBrainz → iTunes → Deezer Cascade**: Fetches the true original release year on-the-fly using a three-level fallback:
  1. **MusicBrainz** (primary): Lucene-syntax query with double-quoted title variations, selects the earliest `first-release-date` from up to 100 results.
  2. **iTunes** (fallback): Candidate-filtered `limit=10` search via dev proxy → `proxy.php` → AllOrigins CORS proxy; returns the minimum year across matching tracks.
  3. **Deezer track metadata** (last resort): Parses `release_date` directly from the track object.
- Prevents remastered or compilation dates (e.g. *Don't Stop Believin'* showing 2001 instead of 1981).

### ❤️ Liked Songs & Player
- **Save Songs**: Heart any song during a turn or on the results screen to add it to your persistent Liked Songs list (backed by `localStorage`). The list is capped at **20 songs** — a dismissible overlay appears when the limit is reached, with an expandable export section (Download .m3u, Download .csv, Clear List with confirmation).
- **Liked Songs Player Modal**: Open the **Player** modal from the setup screen to browse and replay your saved songs. Preview URLs are refreshed automatically when the section is expanded (Deezer CDN links expire after ~1–2 hours). Features:
  - 🎡 Spinning vinyl turntable — idle vinyl disc placeholder, album cover fades in smoothly when a song plays.
  - Full song list with play, info, Deezer/iTunes links, and remove button.
  - TrackInfo modal stacks on top without closing the player.
- **Export Playlist**: Export your Liked Songs as `.m3u`, `.csv`, or a copyable text list for import into Spotify, Apple Music, or Deezer via Soundiiz / TuneMyMusic.

### 📊 Live Score Button
- A **Score** button is always visible at the bottom center of the screen during active gameplay (all phases except Setup and Genre Selection). Tapping it opens a live standings overlay showing all players sorted by score — the currently active player is highlighted with a colored border.

### 🏆 End Screen & Round Replay
- **Winner Screen**: Confetti animation, leaderboard, and full played-songs history with per-song points breakdown.
- **Round Replay Player Modal**: Open the **Player** modal from the winner screen to relisten to all songs from the round. Same spinning turntable, same song info — including who played it and what points were scored.

### 📖 Song Information
- **Wikipedia Summaries**: Cascading search across Song → Album → Artist levels, in both the active game language and the other language as fallback. Disambiguation-aware to prevent wrong page matches.
- **Genius Lyrics Links**: Generates direct Genius.com links client-side with localized artist slug handling (including NDW-specific mismatch corrections).

### 🎨 Themes & Visuals
- **10 Visual Themes**: Default (Neon Party), Plain White, Plain Dark, Cyberpunk, Vaporwave, Westeros, Sakura, Frutiger Aero, Synthwave, Heavy Metal / Rock Legends, Kraftwerk, LCARS, Matrix, Post-Punk — each with a unique color palette and canvas animation.
- **Canvas Background Animations**: High-performance `<canvas>` loop with theme-specific effects (neon particles, Matrix code rain, fire embers, cherry blossoms, bubbles, scan lines, etc.). Automatically respects `prefers-reduced-motion`.
- **Custom Theme Dropdown**: Always renders downward to prevent clipping on mobile screens.

### 🌐 Localization
- Full **English** and **German** localization, including region-specific genre configurations and Wikipedia language fallback.

### 📱 PWA & Installation
- **Screen stays on**: The app uses the **Wake Lock API** to prevent the screen from dimming or locking during active gameplay (Pass Device, Quiz, and Turn Result screens). The lock is re-acquired automatically if the tab is backgrounded and brought back. Supported on iOS 16.4+ and Android Chrome 84+.
- **Installable as an app** on iOS and Android — no App Store required.
- **Offline-capable app shell**: The full UI loads instantly from cache even without a network connection. Music previews and metadata still require internet.
- **Album art caching**: Deezer album covers are cached locally for 7 days for faster reloads.
- **Install on iOS**: Safari → Share → "Add to Home Screen"
- **Install on Android/Desktop**: Chrome address bar install button, or browser menu → "Install app"

---

## 🚀 Usage

### Local Development
```bash
npm install
npm run dev
```
Runs the Vite dev server at `http://localhost:5173` with a local proxy for iTunes year queries. Note: the Service Worker is **not active** in dev mode — use `vite preview` to test PWA functionality locally.

### Test PWA locally
```bash
npm run build
npx vite preview
```
Serves the production build at `http://localhost:4173` with Service Worker and manifest active. Use Chrome DevTools → Application to inspect Service Worker status and manifest.

### Production Build
```bash
npm run build
```
Outputs a static bundle to `dist/`. Because all Deezer fetches use client-side JSONP, **the app can be hosted on any static web server** — GitHub Pages, Netlify, Vercel, Strato, IONOS, cPanel — with zero backend required.

- On **PHP-enabled hosting** (e.g. Strato), the included `proxy.php` handles iTunes year queries server-side.
- On **Vercel / Netlify**, rewrite rules in `vercel.json` / `_redirects` are automatically active.
- On **purely static hosting**, the app falls back to AllOrigins CORS proxy and Deezer metadata — fully functional without any server config.

---

## ⚖️ Disclaimers & API Terms

This application is a **non-commercial hobby project** developed solely for entertainment and educational purposes.

- 🚫 **No Commercial Intent**: No revenue, no ads, no user charges.
- 🔌 **API Utilization**: Music previews and metadata are fetched in real-time from the public APIs of **Deezer**, **iTunes (Apple)**, and **MusicBrainz**.
- ©️ **Ownership**: All audio snippets, artist names, track titles, and album artworks are the intellectual property of their respective owners. This project is not affiliated with or endorsed by Deezer, Apple, MusicBrainz, or any of their subsidiaries.

---

## 📄 License

Released under the [MIT License](LICENSE).
