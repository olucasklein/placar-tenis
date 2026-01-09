import AsyncStorage from '@react-native-async-storage/async-storage';
import { MatchState } from '../types';

const MATCH_KEY = 'tennis_match_state';
const HISTORY_KEY = 'tennis_match_history';

export const saveMatchState = async (matchState: MatchState): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(matchState);
    await AsyncStorage.setItem(MATCH_KEY, jsonValue);
  } catch (error) {
    console.error('Erro ao salvar estado da partida:', error);
  }
};

export const loadMatchState = async (): Promise<MatchState | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(MATCH_KEY);
    if (jsonValue != null) {
      const parsed = JSON.parse(jsonValue) as MatchState;
      if (!parsed.leftTeam?.player1?.name || !parsed.rightTeam?.player1?.name) {
        console.log('Invalid saved state, clearing...');
        await clearMatchState();
        return null;
      }
      return parsed;
    }
    return null;
  } catch (error) {
    console.error('Erro ao carregar estado da partida:', error);
    await clearMatchState();
    return null;
  }
};

export const clearMatchState = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(MATCH_KEY);
  } catch (error) {
    console.error('Erro ao limpar estado da partida:', error);
  }
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Histórico de partidas
export const saveMatchToHistory = async (matchState: MatchState): Promise<void> => {
  try {
    const history = await loadMatchHistory();
    const matchToSave = {
      ...matchState,
      finishedAt: Date.now(),
    };
    history.unshift(matchToSave);
    // Manter apenas as últimas 50 partidas
    const trimmedHistory = history.slice(0, 50);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(trimmedHistory));
  } catch (error) {
    console.error('Erro ao salvar histórico:', error);
  }
};

export const loadMatchHistory = async (): Promise<MatchState[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(HISTORY_KEY);
    if (jsonValue != null) {
      return JSON.parse(jsonValue) as MatchState[];
    }
    return [];
  } catch (error) {
    console.error('Erro ao carregar histórico:', error);
    return [];
  }
};

export const deleteMatchFromHistory = async (matchId: string): Promise<void> => {
  try {
    const history = await loadMatchHistory();
    const filtered = history.filter(m => m.id !== matchId);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Erro ao deletar partida:', error);
  }
};

export const clearMatchHistory = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    console.error('Erro ao limpar histórico:', error);
  }
};
