// Tipos para o placar de tênis

export interface Player {
  name: string;
}

export interface Team {
  player1: Player;
  player2?: Player; // Para partidas de duplas
  color?: string; // Cor customizável em hex (ex: #3B82F6)
}

export interface PointEvent {
  id: string;
  team: 'left' | 'right';
  timestamp: number; // Milissegundos desde o início da partida
  gameScore: {
    left: string;
    right: string;
  };
  setScore: {
    left: number;
    right: number;
  };
}

export interface GameScore {
  // Pontos no game atual: 0, 15, 30, 40, AD (vantagem)
  left: number; // 0, 1, 2, 3, 4 (representa 0, 15, 30, 40, AD)
  right: number;
}

export interface SetScore {
  left: number;
  right: number;
}

export interface MatchState {
  id: string;
  leftTeam: Team;
  rightTeam: Team;
  gameScore: GameScore;
  sets: SetScore[];
  currentSet: number;
  isMatchStarted: boolean;
  isMatchFinished: boolean;
  matchStartTime: number | null;
  matchEndTime: number | null;
  elapsedTime: number;
  pointHistory: PointEvent[];
  winner: 'left' | 'right' | null;
  setsToWin: number;
  gamesPerSet: number;
  isTiebreak: boolean;
  tiebreakScore: {
    left: number;
    right: number;
  };
  finishedAt?: number;
}

export interface MatchConfig {
  setsToWin: number;
  gamesPerSet: number;
  useTiebreak: boolean;
  advantageRule: boolean; // Se usa vantagem ou "No-Ad" (ponto decisivo)
}

export const DEFAULT_MATCH_CONFIG: MatchConfig = {
  setsToWin: 2, // Melhor de 3 sets
  gamesPerSet: 6,
  useTiebreak: true,
  advantageRule: true,
};

export const POINT_DISPLAY: Record<number, string> = {
  0: '0',
  1: '15',
  2: '30',
  3: '40',
  4: 'AD',
};
