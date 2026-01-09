import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Modal,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ScreenOrientation from 'expo-screen-orientation';
import { MatchState } from '../types';
import { createInitialMatchState, formatTime, getMatchStats } from '../utils/matchLogic';
import { loadMatchHistory, deleteMatchFromHistory, saveMatchToHistory } from '../utils/storage';

interface PlayerSetupScreenProps {
  onStartMatch: (matchState: MatchState) => void;
  existingMatch?: MatchState | null;
  onContinueMatch?: () => void;
}

export const PlayerSetupScreen: React.FC<PlayerSetupScreenProps> = ({
  onStartMatch,
  existingMatch,
  onContinueMatch,
}) => {
  const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
  const [isDoubles, setIsDoubles] = useState(false);
  const [team1Name, setTeam1Name] = useState('');
  const [team2Name, setTeam2Name] = useState('');
  const [team1Color, setTeam1Color] = useState('#3B82F6');
  const [team2Color, setTeam2Color] = useState('#8B5CF6');
  const [setsToWin, setSetsToWin] = useState(2);
  const [matchHistory, setMatchHistory] = useState<MatchState[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<MatchState | null>(null);
  const [historyExpanded, setHistoryExpanded] = useState(true);

  const cycleColor = (currentColor: string, setColor: (color: string) => void) => {
    const currentIndex = COLORS.indexOf(currentColor);
    const nextIndex = (currentIndex + 1) % COLORS.length;
    setColor(COLORS[nextIndex]);
  };

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const history = await loadMatchHistory();
    setMatchHistory(history);
  };

  const handleStartMatch = () => {
    const name1 = team1Name.trim() || (isDoubles ? 'Time 1' : 'Jogador 1');
    const name2 = team2Name.trim() || (isDoubles ? 'Time 2' : 'Jogador 2');

    const matchState = createInitialMatchState(name1, name2, setsToWin);
    
    matchState.leftTeam.color = team1Color;
    matchState.rightTeam.color = team2Color;

    if (isDoubles) {
      matchState.leftTeam.player2 = { name: 'Jogador 3' };
      matchState.rightTeam.player2 = { name: 'Jogador 4' };
    }

    onStartMatch(matchState);
  };

  const handleDeleteMatch = async (matchId: string) => {
    Alert.alert('Excluir', 'Remover esta partida do histórico?', [
      { text: 'Cancelar', style: 'cancel' },
      { 
        text: 'Excluir', 
        style: 'destructive',
        onPress: async () => {
          await deleteMatchFromHistory(matchId);
          loadHistory();
          setSelectedMatch(null);
        }
      },
    ]);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const getSetResult = (match: MatchState) => {
    return match.sets.map(s => `${s.left}-${s.right}`).join(' ');
  };

  const isFormValid = true;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.title}>TechScore</Text>
        </View>

        {/* Continue Match */}
        {existingMatch && !existingMatch.isMatchFinished && onContinueMatch && (
          <TouchableOpacity style={styles.continueCard} onPress={onContinueMatch}>
            <Ionicons name="play-circle" size={20} color="#166534" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.continueTitle}>Continuar Partida</Text>
              <Text style={styles.continueSubtitle}>
                {existingMatch.leftTeam.player1.name} vs {existingMatch.rightTeam.player1.name}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#166534" />
          </TouchableOpacity>
        )}

        {/* New Match Form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Nova Partida</Text>
          
          {/* Match Type */}
          <Text style={styles.label}>Tipo</Text>
          <View style={styles.segmented}>
            <TouchableOpacity
              style={[styles.segment, !isDoubles && styles.segmentActive]}
              onPress={() => setIsDoubles(false)}
            >
              <Text style={[styles.segmentText, !isDoubles && styles.segmentTextActive]}>Simples</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segment, isDoubles && styles.segmentActive]}
              onPress={() => setIsDoubles(true)}
            >
              <Text style={[styles.segmentText, isDoubles && styles.segmentTextActive]}>Duplas</Text>
            </TouchableOpacity>
          </View>

          {/* Players */}
          <Text style={styles.label}>{isDoubles ? 'Time 1' : 'Jogador 1'}</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.inputWithColor]}
              placeholder={isDoubles ? "Nome do time" : "Nome do jogador"}
              placeholderTextColor="#9CA3AF"
              value={team1Name}
              onChangeText={setTeam1Name}
            />
            <TouchableOpacity
              style={[styles.colorDot, { backgroundColor: team1Color }]}
              onPress={() => cycleColor(team1Color, setTeam1Color)}
            />
          </View>

          <Text style={[styles.label, { marginTop: 12 }]}>{isDoubles ? 'Time 2' : 'Jogador 2'}</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.inputWithColor]}
              placeholder={isDoubles ? "Nome do time" : "Nome do jogador"}
              placeholderTextColor="#9CA3AF"
              value={team2Name}
              onChangeText={setTeam2Name}
            />
            <TouchableOpacity
              style={[styles.colorDot, { backgroundColor: team2Color }]}
              onPress={() => cycleColor(team2Color, setTeam2Color)}
            />
          </View>

          {/* Format */}
          <Text style={[styles.label, { marginTop: 12 }]}>Formato</Text>
          <View style={styles.segmented}>
            <TouchableOpacity
              style={[styles.segment, setsToWin === 2 && styles.segmentActive]}
              onPress={() => setSetsToWin(2)}
            >
              <Text style={[styles.segmentText, setsToWin === 2 && styles.segmentTextActive]}>Melhor de 3</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segment, setsToWin === 3 && styles.segmentActive]}
              onPress={() => setSetsToWin(3)}
            >
              <Text style={[styles.segmentText, setsToWin === 3 && styles.segmentTextActive]}>Melhor de 5</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.startBtn, !isFormValid && styles.startBtnDisabled]}
            onPress={handleStartMatch}
            disabled={!isFormValid}
          >
            <Text style={styles.startBtnText}>Iniciar Partida</Text>
          </TouchableOpacity>
        </View>

        {/* Match History */}
        {matchHistory.length > 0 && (
          <View style={styles.historySection}>
            <TouchableOpacity 
              style={styles.historyHeader}
              onPress={() => setHistoryExpanded(!historyExpanded)}
            >
              <Text style={styles.historyTitle}>Histórico</Text>
              <Ionicons 
                name={historyExpanded ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color="#374151" 
              />
            </TouchableOpacity>
            {historyExpanded && (
              <View>
                {matchHistory.map((match) => (
                  <TouchableOpacity
                    key={match.id}
                    style={styles.historyCard}
                    onPress={() => setSelectedMatch(match)}
                  >
                    <View style={styles.historyMain}>
                      <Text style={styles.historyPlayers}>
                        {match.leftTeam.player1.name} vs {match.rightTeam.player1.name}
                      </Text>
                      <Text style={styles.historySets}>{getSetResult(match)}</Text>
                    </View>
                    <View style={styles.historyFooter}>
                      <View>
                        <Text style={styles.historyDate}>{formatDate(match.finishedAt || match.matchStartTime || 0)}</Text>
                        <Text style={styles.historyTime}>
                          {formatTime(match.matchStartTime || 0)} - {match.finishedAt ? formatTime(match.finishedAt) : '-'}
                        </Text>
                      </View>
                      {match.winner && (
                        <Text style={styles.historyWinner}>
                          🏆 {match.winner === 'left' ? match.leftTeam.player1.name : match.rightTeam.player1.name}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Match Details Modal */}
      <Modal visible={!!selectedMatch} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedMatch && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Detalhes da Partida</Text>
                  <TouchableOpacity onPress={() => setSelectedMatch(null)}>
                    <Ionicons name="close" size={24} color="#374151" />
                  </TouchableOpacity>
                </View>

                <View style={styles.timeInfo}>
                  <Text style={styles.timeLabel}>Data: {formatDate(selectedMatch.finishedAt || selectedMatch.matchStartTime || 0)}</Text>
                  <Text style={styles.timeLabel}>
                    Horário: {formatTime(selectedMatch.matchStartTime || 0)} - {selectedMatch.finishedAt ? formatTime(selectedMatch.finishedAt) : 'Em progresso'}
                  </Text>
                </View>

                <View style={styles.modalPlayers}>
                  <Text style={styles.modalPlayerName}>{selectedMatch.leftTeam.player1.name}</Text>
                  <Text style={styles.modalVs}>VS</Text>
                  <Text style={styles.modalPlayerName}>{selectedMatch.rightTeam.player1.name}</Text>
                </View>

                {selectedMatch.winner && (
                  <View style={styles.winnerBadge}>
                    <Ionicons name="trophy" size={16} color="#B45309" />
                    <Text style={styles.winnerBadgeText}>
                      {selectedMatch.winner === 'left' ? selectedMatch.leftTeam.player1.name : selectedMatch.rightTeam.player1.name}
                    </Text>
                  </View>
                )}

                <Text style={styles.modalSectionTitle}>Sets</Text>
                <View style={styles.setsGrid}>
                  {selectedMatch.sets.map((s, i) => (
                    <View key={i} style={styles.setBox}>
                      <Text style={styles.setLabel}>Set {i + 1}</Text>
                      <Text style={styles.setScoreText}>{s.left} - {s.right}</Text>
                    </View>
                  ))}
                </View>

                <Text style={styles.modalSectionTitle}>Estatísticas</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{getMatchStats(selectedMatch).totalPoints}</Text>
                    <Text style={styles.statName}>Pontos</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{getMatchStats(selectedMatch).leftPointsCount}</Text>
                    <Text style={styles.statName}>{selectedMatch.leftTeam.player1.name.split(' ')[0]}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{getMatchStats(selectedMatch).rightPointsCount}</Text>
                    <Text style={styles.statName}>{selectedMatch.rightTeam.player1.name.split(' ')[0]}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{formatTime(selectedMatch.elapsedTime)}</Text>
                    <Text style={styles.statName}>Duração</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDeleteMatch(selectedMatch.id)}
                >
                  <Ionicons name="trash-outline" size={18} color="#DC2626" />
                  <Text style={styles.deleteBtnText}>Excluir</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    fontSize: 32,
    fontWeight: '700',
    color: '#C4E538',
    marginBottom: 8,
    letterSpacing: 1,
  },
  logoImage: {
    width: 90,
    height: 90,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  continueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  continueTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
  },
  continueSubtitle: {
    fontSize: 12,
    color: '#15803D',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 3,
    marginBottom: 12,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  segmentTextActive: {
    color: '#1A1A1A',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputWithColor: {
    flex: 1,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  startBtn: {
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  startBtnDisabled: {
    backgroundColor: '#D1D5DB',
  },
  startBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  historySection: {
    marginTop: 24,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  historyCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  historyMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyPlayers: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  historySets: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  historyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  historyDate: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  historyTime: {
    fontSize: 10,
    color: '#BFDBFE',
    marginTop: 2,
  },
  historyWinner: {
    fontSize: 11,
    color: '#B45309',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  timeInfo: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  timeLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  modalPlayers: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 12,
  },
  modalPlayerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  modalVs: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  winnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  winnerBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#B45309',
  },
  modalSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 8,
  },
  setsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  setBox: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  setLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  setScoreText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statItem: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  statName: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  deleteBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#DC2626',
  },
});
