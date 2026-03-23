import os

project_structure = {
    "package.json": """{
  "name": "melodymatch-quiz",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "lucide-react": "^0.344.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.55",
    "@types/react-dom": "^18.2.19",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.2.2",
    "vite": "^5.1.0"
  }
}""",
    "tsconfig.json": """{
  "compilerOptions": {
    "target": "ESNext",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": false,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}""",
    "vite.config.ts": """import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()] });""",
    "index.html": """<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>MelodyMatch</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>""",
    "src/types/index.ts": """
export type Language = 'en' | 'de';
export interface Song { id: number; title: string; artist: string; year: string; previewUrl: string; artworkUrl: string; }
export interface Player { id: string; name: string; score: number; }
export type GamePhase = 'SETUP' | 'PASS_DEVICE' | 'QUIZ' | 'TURN_RESULT' | 'FINAL_RESULTS';
export type QuestionStep = 'TITLE' | 'ARTIST' | 'YEAR';
export interface GameState { lang: Language; players: Player[]; currentPlayerIndex: number; currentRound: number; totalRounds: number; phase: GamePhase; songPool: Song[]; currentSong: Song | null; currentStep: QuestionStep; turnPoints: number; history: Song[]; }
""",
    "src/main.tsx": """import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);""",
    "src/styles.css": """:root { --primary: #6366f1; --bg: #0f172a; --card: #1e293b; --text: #f8fafc; --danger: #ef4444; --success: #22c55e; }
body { margin: 0; font-family: sans-serif; background: var(--bg); color: var(--text); display: flex; justify-content: center; touch-action: manipulation; }
#root { width: 100%; max-width: 500px; min-height: 100vh; padding: 1rem; }
.screen { display: flex; flex-direction: column; gap: 1.5rem; animation: fadeIn 0.3s ease; }
.options-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
.option-button { background: var(--card); border: 2px solid transparent; color: white; padding: 1.25rem; border-radius: 12px; font-size: 1.1rem; font-weight: 600; cursor: pointer; }
.option-button:active { transform: scale(0.98); background: var(--primary); }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }""",
    "src/i18n/translations.ts": """export const translations = {
  en: { title: "MelodyMatch", start: "Start Game", player: "Player", next: "Next", passTo: "Pass device to", beginTurn: "Begin Turn", correct: "Correct!", wrong: "Wrong!", whoIsArtist: "Who is the artist?", whatTitle: "What is the title?", whatYear: "Release year?", totalScore: "Total Score", winner: "Winner!", playAgain: "Play Again", reset: "Reset" },
  de: { title: "MelodyMatch", start: "Start", player: "Spieler", next: "Weiter", passTo: "Gerät an ... übergeben:", beginTurn: "Runde starten", correct: "Richtig!", wrong: "Falsch!", whoIsArtist: "Wer ist der Interpret?", whatTitle: "Wie heißt der Song?", whatYear: "Erscheinungsjahr?", totalScore: "Punktestand", winner: "Gewinner!", playAgain: "Nochmal spielen", reset: "Reset" }
};""",
    "src/services/storage.ts": """import { GameState } from '../types';
const KEY = 'melodymatch_state';
export const saveGameState = (state: GameState) => localStorage.setItem(KEY, JSON.stringify(state));
export const loadGameState = (): GameState | null => {
  const s = localStorage.getItem(KEY);
  return s ? JSON.parse(s) : null;
};""",
}

def create_files():
    for path, content in project_structure.items():
        os.makedirs(os.path.dirname(path) if os.path.dirname(path) else ".", exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            f.write(content.strip())
    print("✅ Projektstruktur für Antigravity wurde erstellt!")

if __name__ == "__main__":
    create_files()