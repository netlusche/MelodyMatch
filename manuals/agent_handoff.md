# MelodyMatch Developer Handoff Guide

Welcome to the **MelodyMatch** codebase! This guide is designed for developer agents to quickly understand the app's structure, flow, quirks, and design decisions so you can continue building and expanding features seamlessly.

---

## 🚀 Overview
MelodyMatch is a localized, local-multiplayer music trivia game where players take turns guessing the Title, Artist, and Release Year of random music tracks fetched in real-time from the iTunes Search API.

---

## 🛠 Tech Stack
- **Framework**: React 18, Vite (TypeScript)
- **Styling**: Pure CSS (`src/styles.css`) featuring modern gradients, glowing elements, glassmorphism, and smooth page transitions.
- **Icons**: `lucide-react`
- **Effects**: `canvas-confetti` (for the winner fireworks celebration)

---

## 📂 Project Structure
```
MelodyMatch/
├── dist/                # Production build output
├── manuals/             # Technical documentation
│   ├── api.md           # Deep dive into iTunes integrations & proxies
│   └── agent_handoff.md # This guide
├── public/              # Static assets
├── src/
│   ├── components/      # UI screen components representing game phases
│   ├── i18n/            # Translations (en, de)
│   ├── services/        # External calls (iTunes API & LocalStorage)
│   ├── state/           # React GameContext and Reducer
│   ├── types/           # TS Interfaces & Types
│   ├── utils/           # Helper scripts (string normalizer, etc.)
│   ├── App.tsx          # Router layout & "Start Over" logic
│   ├── main.tsx         # App entry point
│   └── styles.css       # Core styling & modern visual theme
├── package.json
├── tsconfig.json
└── vite.config.ts       # Configured with base: './' for subdirectory hosting
```

---

## ⚙️ Core Architecture & State Management

State is managed globally using **React Context** (`src/state/GameContext.tsx`) and a **Reducer** (`src/state/gameReducer.ts`). 
- **Persistency**: The global state automatically synchronizes to `localStorage` (`melodymatch_state`) on every change. When the application loads, it attempts to load state from storage, preventing loss of progress on page refresh.

### Game State Type Def (`src/types/index.ts`):
```typescript
export interface GameState {
  lang: Language;                // 'en' | 'de'
  players: Player[];             // Array of players with score
  currentPlayerIndex: number;
  currentRound: number;
  totalRounds: number;
  phase: GamePhase;              // SETUP, GENRE_SELECTION, PASS_DEVICE, QUIZ, etc.
  songPool: Song[];              // Shuffled list of 100 songs
  currentSong: Song | null;      // Song active in the current turn
  currentStep: QuestionStep;     // TITLE -> ARTIST -> YEAR
  turnPoints: number;            // Accumulated points in current turn
  turnResults: {                 // Breakdown of points for the active turn
    title: number; 
    artist: number; 
    year: number; 
  };
  history: Song[];               // Played songs list (to prevent duplication)
  genres: string[];              // Selected genres
}
```

---

## 🔄 Lifecycle of a Game Session

1. **`SETUP` Screen (`SetupScreen.tsx`)**:
   - The user selects the language (English/German), chooses the number of rounds, and inputs 1 to 6 player names.
   - *Start Over / Play Again retention*: When starting a new game session after completion, names, language, and rounds are prefilled from the previous session's state.

2. **`GENRE_SELECTION` Screen (`GenreScreen.tsx`)**:
   - Offers core base genres (Pop, Rock, Heavy Metal, etc.) and regional specialties for German users (Schlager, NDW, Ballermann, Deutschpop).
   - Upon clicking "Start", the app fetches **100 songs** matching the selection from the iTunes Search API via `src/services/api.ts` (see [manuals/api.md](file:///Users/frank/Antigravity/MelodyMatch/manuals/api.md) for details).
   - The game phase shifts to `PASS_DEVICE`.

3. **`PASS_DEVICE` Screen (`PassDeviceScreen.tsx`)**:
   - Prompt telling the players to pass the mobile/desktop device to the player named on the screen (e.g. *"Pass device to Player 2"*).
   - Forces players to play locally on one screen.

4. **`QUIZ` Screen (`QuizScreen.tsx`)**:
   - Triggers automatic play of the track's 30-second preview audio.
   - Serves **3 step-based questions** sequentially:
     1. **TITLE** (Value: 10 pts) -> Guesses title name.
     2. **ARTIST** (Value: 5 pts) -> Guesses artist name.
     3. **YEAR** (Value: 5 pts) -> Guesses release year.
   - Dynamic wrong multiple-choice distractors are generated out of the 100-song pool.
   - After the `YEAR` question, the turn ends and dispatches an `END_TURN` action.

5. **`TURN_RESULT` Screen (`TurnResultScreen.tsx`)**:
   - Displays correct answers, album cover art (high-res), and shows a breakdown of how many points the current player earned.
   - Clicking "Next" dispatches `NEXT_TURN` which determines if the game moves to the next player, next round, or transitions to `FINAL_RESULTS`.

6. **`FINAL_RESULTS` Screen (`FinalResultsScreen.tsx`)**:
   - Renders a leaderboard sorted by scores and celebrates the winner with animated CSS gradients and a cascading confetti shower.
   - **"Play Again" Button**: Triggers a clean transition back to the `SETUP` screen while maintaining the previously entered player names and language.

---

## ⚡ Developer Gotchas & Details

### 1. iTunes CORS & iOS Safari Redirection Bypasses
The native iTunes Search API causes severe blocks on iOS Safari (redirects to the Apple Music app or `itmss://` schema). We bypass this with:
- A proxy system (`api.codetabs.com` and `corsproxy.io`) which removes iOS headers and handles CORS headers.
- Automatic text search fallback when specific genres return empty results (since iTunes doesn't natively map genres like "Ballermann" or "NDW").
- Refer to [manuals/api.md](file:///Users/frank/Antigravity/MelodyMatch/manuals/api.md) for full network implementation details.

### 2. Strict Song Deduplication
iTunes lists the same song on multiple compilation/original albums. To prevent players from encountering duplicate tracks, the helper `normalizeString` (found in `src/utils/stringUtils.ts`) strips out:
- Parentheses: `(Remastered)`, `(Radio Edit)`
- Brackets: `[Live]`
- Spaced hyphens: ` - Live Version`
- Featuring details: `feat. X` or `ft. Y`
- Spaces, symbols, and casing.
A `Set` uses this normalized `title-artist` key to guarantee that overlapping items are filtered out at the API boundary.

---

## 🌟 Future Opportunities
- **Sound Effects**: Adding correct/incorrect sound effects on click.
- **Local Cache**: Cache the fetched track metadata to allow rapid startup on subsequent runs.
- **Dynamic Scoring**: Give extra points for fast answers.
