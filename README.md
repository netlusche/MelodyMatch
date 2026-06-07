# MelodyMatch

A fast-paced, interactive, modern local-multiplayer music quiz built with React, Vite, and the Deezer & iTunes APIs.

## Features
- **Direct Music Previews**: Plays track snippets directly from the **Deezer API**. Since it uses client-side JSONP (`output=jsonp`), it completely bypasses CORS restrictions directly in the browser without requiring any proxy servers or backend redirections.
- **Curated Playlists & Charts**: 
  - Selecting **Charts** pulls directly from Deezer's global top hits.
  - Selecting sub-genres (e.g. *Indie*, *Classic Rock*, *Schlager*, *NDW*, *Deutschpop*, *Deutscher Rap*, *Ballermann*, *New Wave / Post-Punk*, *Partyhits*) fetches songs directly from top curated editorial playlists rather than text searches. This guarantees genuine genre hits and completely avoids search pollution.
  - When playing with multiple genres, the combined song pool is shuffled using a mathematically unbiased **Fisher-Yates shuffle algorithm**, ensuring a completely uniform distribution and preventing any single genre from dominating the gameplay.
- **Original Release Year Lookup**: To prevent remastered or compilation album dates (e.g. Journey's *Don't Stop Believin'* showing 2001 instead of 1981), the app queries the **MusicBrainz API** on-the-fly, searching up to 100 recording matches to extract the earliest release date. It cascades through the **iTunes Search API** (via local dev proxy, `proxy.php`, or AllOrigins proxy) and falls back to the **Deezer API** track metadata.
- **Global Title & Text Sanitization**: Suffixes like `(Remastered)`, `(2001 Remaster)`, `[Live]`, or `(Rerecorded)` are automatically stripped globally, ensuring clean titles are displayed in the UI and multiple-choice distractor options.
- **Double-Click & Rapid-Tap Protection**: State transition buttons and multiple-choice answer grids are guarded against rapid consecutive taps, preventing accidental step skips or out-of-sync audio queues.
- **Safari Autoplay Unlock**: Synchronously anchors the audio play promise to the user gesture (e.g., clicking "Begin Turn"), ensuring audio previews play instantly on iOS Safari.
- **Expanded Theme System & Canvas Animation Effects**: Easily switch between seven visual themes: **Default (Neon Party)**, **Plain White (accessible light mode)**, **Plain Dark**, **Cyberpunk**, **Vaporwave**, **Westeros**, and **Sakura**. A high-performance fixed `<canvas>` background renders customized theme-specific animation loops (drifting neon particles, twinkling star fields, Matrix binary code streams, scrolling perspective grids, rising warm fire embers, or falling cherry blossom petals) that automatically respect system `prefers-reduced-motion` settings.
- **Modern Theme Selector Dropdown**: Built a custom React-based dropdown selector replacing native pickers to ensure it always renders downwards (preventing clipping on mobile screens) and supports custom scrolling.
- **Persistent Favorites Playlist ("Liked Songs")**: Save discovered songs to a local storage-backed playlist directly during turns or on the final results scoreboard. Features include in-app preview playing, Apple Music/Deezer search links, and clear-list utilities.
- **Genre Selection Constraints & Alerts**: Matching the visual design of the active theme, the start button goes visually inactive when no genres are selected. Pressing it triggers a beautiful glassmorphism-styled warning modal prompting the user to select at least one genre.
- **Localization**: Full English (EN) and German (DE) localization, including region-specific genre configurations.

## Usage

### Local Development
```bash
npm install
npm run dev
```
*(Runs the Vite dev server at http://localhost:5173 with a local dev proxy config to ease iTunes search requests.)*

### Production Build & Deployment
```bash
npm run build
```
The compiled static bundle is generated in the `dist/` directory.

Because the Deezer song fetches use client-side JSONP, **the application can be hosted on any purely static web server** (including Strato, IONOS, cPanel, GitHub Pages, Netlify, Vercel, etc.) and it will work immediately out of the box!
- The iTunes year-lookup cascades through client-side options (AllOrigins CORS proxy and Deezer fallback), meaning **no server-side proxies or backend rewrites are required for the game to function**.
- Optionally, if you host on a PHP-enabled server, the included `proxy.php` will be used to proxy iTunes year queries. On Vercel or Netlify, the included rewrite rules in `vercel.json` and `_redirects` will be automatically active.

## Disclaimers & API Terms
This application is a **non-commercial hobby project** developed solely for entertainment and educational purposes.
- **No Commercial Intent**: This application does not generate revenue, contain ads, or charge users in any way.
- **API Utilization**: Music previews and metadata are fetched in real-time from the public APIs of **Deezer**, **iTunes (Apple)**, and **MusicBrainz**.
- **Ownership**: All audio snippets, artist names, track titles, and album artworks are the intellectual property of their respective owners and copyright holders. This project is not affiliated, associated, authorized, endorsed by, or in any way officially connected with Deezer, Apple, MusicBrainz, or any of their subsidiaries or affiliates.

## License
Released under the [MIT License](file:///Users/frank/Antigravity/MelodyMatch/LICENSE).
