import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ScreenOrientation from 'expo-screen-orientation';
import { MatchState } from '../types';
import {
  getPointDisplay,
  formatTime,
  addPoint,
  removeLastPoint,
  getMatchStats,
} from '../utils/matchLogic';
import { saveMatchState, clearMatchState, saveMatchToHistory } from '../utils/storage';

interface Props {
  matchState: MatchState;
  onMatchUpdate: (state: MatchState) => void;
  onFinishMatch: () => void;
  onNewMatch: () => void;
}

export const ScoreboardScreen: React.FC<Props> = ({
  matchState: rawState,
  onMatchUpdate,
  onFinishMatch,
  onNewMatch,
}) => {
  const insets = useSafeAreaInsets();
  const matchState = {
    ...rawState,
    leftTeam: rawState.leftTeam || { player1: { name: 'Jogador 1' } },
    rightTeam: rawState.rightTeam || { player1: { name: 'Jogador 2' } },
    pointHistory: rawState.pointHistory || [],
    gameScore: rawState.gameScore || { left: 0, right: 0 },
    tiebreakScore: rawState.tiebreakScore || { left: 0, right: 0 },
    sets: rawState.sets || [{ left: 0, right: 0 }],
    isTiebreak: rawState.isTiebreak || false,
    elapsedTime: rawState.elapsedTime || 0,
    isMatchStarted: rawState.isMatchStarted || false,
    isMatchFinished: rawState.isMatchFinished || false,
  };

  const [menuState, setMenuState] = useState<'none' | 'main' | 'stats' | 'edit'>('none');
  const leftName = matchState.leftTeam?.player1?.name || 'Jogador 1';
  const rightName = matchState.rightTeam?.player1?.name || 'Jogador 2';
  const [editLeft, setEditLeft] = useState(leftName);
  const [editRight, setEditRight] = useState(rightName);
  const [displayTime, setDisplayTime] = useState(rawState.elapsedTime || 0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const matchStartTimeRef = useRef<number | null>(rawState.matchStartTime || null);

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
  }, []);

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (rawState.isMatchStarted && !rawState.isMatchFinished) {
      matchStartTimeRef.current = rawState.matchStartTime || Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - (matchStartTimeRef.current || Date.now());
        setDisplayTime(elapsed);
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [rawState.isMatchStarted, rawState.isMatchFinished, rawState.matchStartTime]);

  useEffect(() => {
    if (rawState.isMatchStarted || rawState.isMatchFinished) {
      saveMatchState({ ...rawState, elapsedTime: displayTime }).catch(() => {});
    }
  }, [rawState.pointHistory?.length, rawState.isMatchStarted, rawState.isMatchFinished]);

  const handleStart = () => {
    onMatchUpdate({ ...matchState, isMatchStarted: true, matchStartTime: Date.now() });
  };

  const handlePoint = (team: 'left' | 'right') => {
    if (!matchState.isMatchStarted || matchState.isMatchFinished) return;
    const newState = addPoint(matchState, team);
    onMatchUpdate(newState);
    setMenuState('none');
    
    if (newState.isMatchFinished) {
      const stateWithFinishTime = { ...newState, finishedAt: Date.now(), elapsedTime: displayTime };
      saveMatchToHistory(stateWithFinishTime).catch(() => {});
    }
  };

  const handleUndo = () => {
    const newState = removeLastPoint(matchState);
    onMatchUpdate(newState);
  };

  const handleSave = () => {
    onMatchUpdate({
      ...matchState,
      leftTeam: { player1: { name: editLeft || 'Jogador 1' } },
      rightTeam: { player1: { name: editRight || 'Jogador 2' } },
    });
    setMenuState('none');
  };

  const handleFinish = () => {
    if (!matchState.isMatchStarted) {
      // Partida não começou, voltar para menu
      Alert.alert('Voltar', 'Descartar esta partida?', [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sim', 
          onPress: async () => { 
            await clearMatchState(); 
            onNewMatch(); 
          }
        },
      ]);
    } else {
      // Partida começou, finalizar normalmente
      Alert.alert('Finalizar', 'Tem certeza?', [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sim', 
          onPress: async () => { 
            await saveMatchToHistory({ ...matchState, finishedAt: Date.now(), elapsedTime: displayTime });
            await clearMatchState(); 
            onFinishMatch(); 
          }
        },
      ]);
    }
  };

  const handleNew = () => {
    Alert.alert('Nova Partida', 'Dados serão perdidos.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sim', onPress: () => { clearMatchState(); onNewMatch(); } },
    ]);
  };

  const leftScore = getPointDisplay(
    matchState.isTiebreak ? matchState.tiebreakScore.left : matchState.gameScore.left,
    matchState.isTiebreak ? matchState.tiebreakScore.right : matchState.gameScore.right,
    matchState.isTiebreak
  );
  
  const rightScore = getPointDisplay(
    matchState.isTiebreak ? matchState.tiebreakScore.right : matchState.gameScore.right,
    matchState.isTiebreak ? matchState.tiebreakScore.left : matchState.gameScore.left,
    matchState.isTiebreak
  );

  const stats = getMatchStats(matchState);

  return (
    <View style={styles.container}>
      {menuState !== 'none' && (
        <Pressable style={styles.overlay} onPress={() => setMenuState('none')} />
      )}

      <View style={styles.header}>
        <Text style={styles.time}>{formatTime(displayTime)}</Text>
        {matchState.isTiebreak && <Text style={styles.tiebreak}>TIEBREAK</Text>}
        <TouchableOpacity style={styles.menuBtn} onPress={() => setMenuState(menuState === 'none' ? 'main' : 'none')}>
          <Ionicons name={menuState === 'none' ? 'menu' : 'close'} size={22} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      <View style={styles.scoreArea}>
        <View style={styles.teamBox}>
          <Text style={[styles.teamName, { color: matchState.leftTeam.color || '#6B7280' }]}>{leftName}</Text>
          <Text style={styles.score}>{leftScore}</Text>
          <View style={styles.setsRow}>
            {(matchState.sets || []).map((s, i) => (
              <Text key={i} style={styles.setScore}>{s.left}</Text>
            ))}
          </View>
        </View>

        <Text style={styles.vs}>VS</Text>

        <View style={styles.teamBox}>
          <Text style={[styles.teamName, { color: matchState.rightTeam.color || '#6B7280' }]}>{rightName}</Text>
          <Text style={styles.score}>{rightScore}</Text>
          <View style={styles.setsRow}>
            {(matchState.sets || []).map((s, i) => (
              <Text key={i} style={styles.setScore}>{s.right}</Text>
            ))}
          </View>
        </View>
      </View>

      {!matchState.isMatchStarted && (
        <TouchableOpacity style={styles.startBtn} onPress={handleStart}>
          <Text style={styles.startText}>Iniciar Partida</Text>
        </TouchableOpacity>
      )}

      {matchState.isMatchFinished && matchState.winner && (
        <View style={styles.winnerBox}>
          <Text style={styles.winnerText}>
            🏆 {matchState.winner === 'left' ? leftName : rightName} venceu!
          </Text>
        </View>
      )}

      {menuState !== 'none' && (
        <View style={[styles.sidePanel, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {menuState === 'main' && (
              <>
                <Text style={styles.panelTitle}>Menu</Text>
                
                {matchState.isMatchStarted && !matchState.isMatchFinished && (
                  <>
                    <Text style={styles.sectionLabel}>Adicionar Ponto</Text>
                    <View style={styles.pointRow}>
                      <TouchableOpacity style={[styles.pointBtn, { backgroundColor: matchState.leftTeam.color || '#3B82F6' }]} onPress={() => handlePoint('left')}>
                        <Text style={styles.pointBtnText}>{leftName}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.pointBtn, { backgroundColor: matchState.rightTeam.color || '#8B5CF6' }]} onPress={() => handlePoint('right')}>
                        <Text style={styles.pointBtnText}>{rightName}</Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.undoBtn} onPress={handleUndo}>
                      <Ionicons name="arrow-undo" size={16} color="#EF4444" />
                      <Text style={styles.undoText}>Desfazer</Text>
                    </TouchableOpacity>

                    <View style={styles.divider} />
                  </>
                )}

                <TouchableOpacity style={styles.menuItem} onPress={() => setMenuState('stats')}>
                  <Ionicons name="stats-chart" size={18} color="#374151" />
                  <Text style={styles.menuItemText}>Estatísticas</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={() => setMenuState('edit')}>
                  <Ionicons name="create-outline" size={18} color="#374151" />
                  <Text style={styles.menuItemText}>Editar Jogadores</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={handleNew}>
                  <Ionicons name="refresh" size={18} color="#374151" />
                  <Text style={styles.menuItemText}>Nova Partida</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.menuItem, styles.dangerItem]} onPress={handleFinish}>
                  <Ionicons name={matchState.isMatchStarted ? "stop-circle-outline" : "arrow-back"} size={18} color="#DC2626" />
                  <Text style={[styles.menuItemText, styles.dangerText]}>{matchState.isMatchStarted ? 'Finalizar' : 'Voltar pro Menu'}</Text>
                </TouchableOpacity>
                <View style={{ height: Math.max(insets.bottom, 16) }} />
              </>
            )}

            {menuState === 'stats' && (
              <>
                <View style={styles.panelHeader}>
                  <TouchableOpacity onPress={() => setMenuState('main')}>
                    <Ionicons name="chevron-back" size={22} color="#374151" />
                  </TouchableOpacity>
                  <Text style={styles.panelTitle}>Estatísticas</Text>
                </View>
                
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Total de Pontos</Text>
                  <Text style={styles.statValue}>{stats.totalPoints}</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>{leftName}</Text>
                  <Text style={styles.statValue}>{stats.leftPointsCount} pts</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>{rightName}</Text>
                  <Text style={styles.statValue}>{stats.rightPointsCount} pts</Text>
                </View>

                <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Últimos Pontos</Text>
                {stats.pointsByMinute.length === 0 ? (
                  <Text style={styles.emptyText}>Nenhum ponto ainda</Text>
                ) : (
                  stats.pointsByMinute.slice(-8).map((p, i) => (
                    <View key={i} style={styles.historyItem}>
                      <Text style={styles.historyTime}>{p.minute}</Text>
                      <Text style={p.team === 'left' ? styles.leftText : styles.rightText}>
                        {p.team === 'left' ? leftName : rightName}
                      </Text>
                    </View>
                  ))
                )}
              </>
            )}

            {menuState === 'edit' && (
              <>
                <View style={styles.panelHeader}>
                  <TouchableOpacity onPress={() => setMenuState('main')}>
                    <Ionicons name="chevron-back" size={22} color="#374151" />
                  </TouchableOpacity>
                  <Text style={styles.panelTitle}>Editar</Text>
                </View>
                
                <Text style={styles.inputLabel}>Jogador 1</Text>
                <TextInput
                  style={styles.input}
                  value={editLeft}
                  onChangeText={setEditLeft}
                  placeholder="Nome"
                />

                <Text style={[styles.inputLabel, { marginTop: 12 }]}>Jogador 2</Text>
                <TextInput
                  style={styles.input}
                  value={editRight}
                  onChangeText={setEditRight}
                  placeholder="Nome"
                />

                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                  <Text style={styles.saveBtnText}>Salvar</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  time: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  tiebreak: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  scoreArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  teamBox: {
    alignItems: 'center',
  },
  teamName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  score: {
    fontSize: 72,
    fontWeight: '200',
    color: '#1A1A1A',
  },
  setsRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 6,
  },
  setScore: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    backgroundColor: '#E5E7EB',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  vs: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  startBtn: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: '#1A1A1A',
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 24,
  },
  startText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  winnerBox: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    backgroundColor: '#FEF3C7',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  winnerText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#B45309',
  },
  sidePanel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '45%',
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderLeftColor: '#E5E7EB',
    paddingTop: 16,
    paddingHorizontal: 16,
    zIndex: 2,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  pointRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  pointBtn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftBtn: {
    backgroundColor: '#3B82F6',
  },
  rightBtn: {
    backgroundColor: '#8B5CF6',
  },
  pointBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  undoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 36,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    marginBottom: 16,
  },
  undoText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#EF4444',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 44,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  dangerItem: {
    backgroundColor: '#FEF2F2',
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  dangerText: {
    color: '#DC2626',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  statValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    gap: 8,
  },
  historyTime: {
    fontSize: 11,
    color: '#9CA3AF',
    width: 32,
  },
  leftText: {
    fontSize: 13,
    color: '#3B82F6',
  },
  rightText: {
    fontSize: 13,
    color: '#8B5CF6',
  },
  emptyText: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  saveBtn: {
    backgroundColor: '#1A1A1A',
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
