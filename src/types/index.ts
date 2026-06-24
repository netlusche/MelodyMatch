export type Language = 'en' | 'de';
export type Theme = 'default' | 'plain_white' | 'plain_dark' | 'matrix' | 'vaporwave' | 'westeros' | 'sakura' | 'lcars' | 'frutiger_aero' | 'synthwave' | 'heavy_metal' | 'post_punk' | 'rock_legends' | 'kraftwerk' | 'neon_party';
export interface Song { id: number; title: string; artist: string; year: string; previewUrl: string; artworkUrl: string; album?: string; }
export interface PlayedSong {
  song: Song;
  player: string;
  points: number;
  results: {
    title: number;
    artist: number;
    year: number;
  };
}
export interface Player { id: string; name: string; score: number; }
export type GamePhase = 'LANDING' | 'SETUP' | 'GENRE_SELECTION' | 'PASS_DEVICE' | 'QUIZ' | 'TURN_RESULT' | 'FINAL_RESULTS';
export type QuestionStep = 'TITLE' | 'ARTIST' | 'YEAR';
export interface GameState { lang: Language; theme: Theme; players: Player[]; currentPlayerIndex: number; currentRound: number; totalRounds: number; phase: GamePhase; songPool: Song[]; currentSong: Song | null; currentStep: QuestionStep; turnPoints: number; turnResults: { title: number; artist: number; year: number; }; history: PlayedSong[]; genres: string[]; }