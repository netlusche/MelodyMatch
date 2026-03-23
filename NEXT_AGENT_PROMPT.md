# AI Handoff Prompt: MelodyMatch Song Deduping & iTunes API

**Context for the New Agent:**
You are taking over development of **MelodyMatch (v0.1.0)**, a fast-paced local-multiplayer music quiz built with React, Vite, and custom CSS. 
The application sources its audio directly from the public **iTunes Search API**, retrieving 30-second audio previews, deep-links, and metadata (Track, Artist, Year, High-Res Album Art).

**Current API Implementation & Known Issues (`src/services/api.ts`):**
1. We presently fetch the audio using **native `fetch()`** on the `https://itunes.apple.com/search` endpoint instead of JSONP. The API natively returns CORS headers (`access-control-allow-origin: *`).
2. We query a maximum of **100 songs** independently of the chosen round count. This ensures an exceptionally large global `songPool`, dramatically increasing variety for the generic multiple-choice wrong-answer generators in `QuizScreen.tsx`.
3. **The iOS Safari Deep-Link Bug**: Be aware that the native iTunes API has a severe limitation! Apple actively intercepts XHR/Fetch/JSONP requests originating from a **Mobile Safari User-Agent** and forcefully responds with a `301/302 Redirect` to their custom `itmss://` (Apple Music) schema. Because standard Browser APIs reject schema hopping, `fetch()` on an iPhone throws an inescapable `NetworkError`, crashing the pool load and forcing the game to use generic fallback Demo Songs.
4. **Current Deduplication Engine**: We aggressively deduplicate iTunes compilation records (like "Kids Bop", "Top 100", etc. which re-release exact songs under new IDs) via a hyper-aggressive `RegExp` text normalizer. It rips out `(Radio Edit)`, `[Remastered]`, trailing hyphens, and `feat.` artists. It then uses a `Set` to enforce strictly unique combinations of `trackName + artistName`.

**Your Mission:**
The user's absolute top priority is: **"Maximum assurance that absolutely NO song repetitions occur within a single game session."**
- **Mobile Safari Fetch Fix:** Your very first step must be resolving the Mobile Safari Apple Music JSON/XHR Redirect intercept issue. All `fetch` requests on mobile devices must either correctly proxy via a third-party non-mobile-user-agent, or employ an advanced bypass. We previously tested `corsproxy.io` and `api.codetabs.com/v1/proxy?quest=`. Please find a definitive permanent solution so iOS users can pull Real Songs.
- **Deduplication Hardening:** Inspect the `QuizScreen.tsx` (`getOptions` logic) and `gameReducer.ts` filter flows to absolutely guarantee there isn't a single edge case where the generated false "wrong options" randomly overlap with identical title names, or where a user encounters overlapping tracks across 10 rounds.

Proceed to deeply investigate `src/services/api.ts` and `src/components/QuizScreen.tsx`. Good luck!
