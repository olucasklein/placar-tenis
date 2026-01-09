import { MatchState, Team } from '../types';

// Função para obter o nome de exibição do time
export const getTeamDisplayName = (team: Team | null | undefined): string => {
  if (!team || !team.player1) {
    return 'Player';
  }
  if (team.player2 && team.player2.name) {
    return `${team.player1.name || 'Player 1'} / ${team.player2.name}`;
  }
  return team.player1.name || 'Player';
};

// Função para verificar se é um jogo de duplas
export const isDoublesMatch = (matchState: MatchState | null | undefined): boolean => {
  if (!matchState || !matchState.leftTeam || !matchState.rightTeam) {
    return false;
  }
  return !!(matchState.leftTeam.player2 && matchState.rightTeam.player2);
};