import { MatchState, GameScore, SetScore, PointEvent, POINT_DISPLAY } from '../types';
import { generateId } from './storage';

// Converte pontuação interna para exibição
export const getPointDisplay = (points: number, opponentPoints: number, isTiebreak: boolean): string => {
  if (isTiebreak) {
    return points.toString();
  }
  
  // Deuce e vantagem
  if (points >= 3 && opponentPoints >= 3) {
    if (points === opponentPoints) return '40';
    if (points > opponentPoints) return 'AD';
    return '40';
  }
  
  return POINT_DISPLAY[points] || points.toString();
};

// Formata tempo em MM:SS
export const formatTime = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// Formata minuto para estatísticas
export const formatMinute = (milliseconds: number): string => {
  const minutes = Math.floor(milliseconds / 60000);
  return `${minutes}'`;
};

// Cria estado inicial da partida
export const createInitialMatchState = (
  leftTeamName: string,
  rightTeamName: string,
  setsToWin: number = 2
): MatchState => {
  return {
    id: generateId(),
    leftTeam: { 
      player1: { 
        name: leftTeamName.includes(' / ') ? leftTeamName.split(' / ')[0] : leftTeamName 
      } 
    },
    rightTeam: { 
      player1: { 
        name: rightTeamName.includes(' / ') ? rightTeamName.split(' / ')[0] : rightTeamName 
      } 
    },
    gameScore: { left: 0, right: 0 },
    sets: [{ left: 0, right: 0 }],
    currentSet: 0,
    isMatchStarted: false,
    isMatchFinished: false,
    matchStartTime: null,
    matchEndTime: null,
    elapsedTime: 0,
    pointHistory: [],
    winner: null,
    setsToWin,
    gamesPerSet: 6,
    isTiebreak: false,
    tiebreakScore: { left: 0, right: 0 },
  };
};

// Verifica se é tiebreak
const checkTiebreak = (setScore: SetScore, gamesPerSet: number): boolean => {
  return setScore.left === gamesPerSet && setScore.right === gamesPerSet;
};

// Processa ponto no tiebreak
const processTiebreakPoint = (
  state: MatchState,
  team: 'left' | 'right'
): MatchState => {
  const newState = { ...state };
  const opponent = team === 'left' ? 'right' : 'left';
  
  newState.tiebreakScore = { ...state.tiebreakScore };
  newState.tiebreakScore[team]++;
  
  const teamPoints = newState.tiebreakScore[team];
  const opponentPoints = newState.tiebreakScore[opponent];
  
  // Ganha tiebreak com 7+ pontos e 2 de diferença
  if (teamPoints >= 7 && teamPoints - opponentPoints >= 2) {
    // Ganha o set
    newState.sets = [...state.sets];
    newState.sets[state.currentSet] = { ...state.sets[state.currentSet] };
    newState.sets[state.currentSet][team]++;
    
    // Verifica se ganhou a partida
    const setsWon = newState.sets.filter(s => s[team] > s[opponent]).length;
    if (setsWon >= state.setsToWin) {
      newState.isMatchFinished = true;
      newState.winner = team;
      newState.matchEndTime = Date.now();
    } else {
      // Novo set
      newState.currentSet++;
      newState.sets.push({ left: 0, right: 0 });
    }
    
    // Reset tiebreak
    newState.isTiebreak = false;
    newState.tiebreakScore = { left: 0, right: 0 };
    newState.gameScore = { left: 0, right: 0 };
  }
  
  return newState;
};

// Adiciona ponto para um time
export const addPoint = (state: MatchState, team: 'left' | 'right'): MatchState => {
  if (state.isMatchFinished || !state.isMatchStarted) return state;
  
  let newState = { ...state };
  const opponent = team === 'left' ? 'right' : 'left';
  
  // Registra o evento do ponto
  const pointEvent: PointEvent = {
    id: generateId(),
    team,
    timestamp: state.elapsedTime,
    gameScore: {
      left: getPointDisplay(state.gameScore.left, state.gameScore.right, state.isTiebreak),
      right: getPointDisplay(state.gameScore.right, state.gameScore.left, state.isTiebreak),
    },
    setScore: { ...state.sets[state.currentSet] },
  };
  newState.pointHistory = [...state.pointHistory, pointEvent];
  
  // Tiebreak
  if (state.isTiebreak) {
    return processTiebreakPoint(newState, team);
  }
  
  // Game normal
  newState.gameScore = { ...state.gameScore };
  newState.gameScore[team]++;
  
  const teamPoints = newState.gameScore[team];
  const opponentPoints = newState.gameScore[opponent];
  
  // Verifica se ganhou o game
  let wonGame = false;
  
  if (teamPoints >= 4 && teamPoints - opponentPoints >= 2) {
    wonGame = true;
  }
  
  if (wonGame) {
    // Atualiza placar do set
    newState.sets = [...state.sets];
    newState.sets[state.currentSet] = { ...state.sets[state.currentSet] };
    newState.sets[state.currentSet][team]++;
    
    const setScore = newState.sets[state.currentSet];
    
    // Verifica tiebreak
    if (checkTiebreak(setScore, state.gamesPerSet)) {
      newState.isTiebreak = true;
      newState.tiebreakScore = { left: 0, right: 0 };
    }
    // Verifica se ganhou o set (6 games com 2 de diferença, ou 7-5, ou tiebreak)
    else if (
      setScore[team] >= state.gamesPerSet &&
      setScore[team] - setScore[opponent] >= 2
    ) {
      // Verifica se ganhou a partida
      const setsWon = newState.sets.filter(s => 
        (s[team] > s[opponent] && s[team] >= state.gamesPerSet)
      ).length;
      
      if (setsWon >= state.setsToWin) {
        newState.isMatchFinished = true;
        newState.winner = team;
        newState.matchEndTime = Date.now();
      } else {
        // Novo set
        newState.currentSet++;
        newState.sets.push({ left: 0, right: 0 });
      }
    }
    
    // Reset game score
    newState.gameScore = { left: 0, right: 0 };
  }
  
  return newState;
};

// Remove último ponto (desfazer)
export const removeLastPoint = (state: MatchState): MatchState => {
  if (state.pointHistory.length === 0 || !state.isMatchStarted) return state;
  
  // Implementação simplificada: remove o último evento
  // Em uma implementação mais robusta, seria necessário recalcular todo o estado
  const newHistory = [...state.pointHistory];
  newHistory.pop();
  
  // Recalcula o estado desde o início
  let newState = createInitialMatchState(
    state.leftTeam.player1.name,
    state.rightTeam.player1.name,
    state.setsToWin
  );
  newState.isMatchStarted = true;
  newState.matchStartTime = state.matchStartTime;
  newState.elapsedTime = state.elapsedTime;
  newState.id = state.id;
  
  // Replay de todos os pontos exceto o último
  for (const event of newHistory) {
    newState = addPoint(newState, event.team);
  }
  
  // Restaura o histórico correto
  newState.pointHistory = newHistory;
  
  return newState;
};

// Obtém estatísticas da partida
export const getMatchStats = (state: MatchState) => {
  const pointHistory = state.pointHistory || [];
  const leftPoints = pointHistory.filter(p => p.team === 'left');
  const rightPoints = pointHistory.filter(p => p.team === 'right');
  
  return {
    totalPoints: pointHistory.length,
    leftPointsCount: leftPoints.length,
    rightPointsCount: rightPoints.length,
    pointsByMinute: pointHistory.map(p => ({
      ...p,
      minute: formatMinute(p.timestamp || 0),
    })),
  };
};
