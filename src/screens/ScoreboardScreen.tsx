import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { MatchState } from '../types';
import {
  getPointDisplay,
  formatTime,
  addPoint,
  removeLastPoint,
  getMatchStats,
  formatMinute,
} from '../utils/matchLogic';
import { saveMatchState, clearMatchState } from '../utils/storage';
import { getTeamDisplayName, isDoublesMatch } from '../utils/teamHelper';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ScoreboardScreenProps {
  matchState: MatchState;
  onMatchUpdate: (state: MatchState) => void;
  onFinishMatch: () => void;
  onNewMatch: () => void;
}

export const ScoreboardScreen: React.FC<ScoreboardScreenProps> = ({
  matchState,
  onMatchUpdate,
  onFinishMatch,
  onNewMatch,
}) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const [editPlayersVisible, setEditPlayersVisible] = useState(false);
  const [leftPlayer1Name, setLeftPlayer1Name] = useState(matchState.leftTeam.player1.name);
  const [leftPlayer2Name, setLeftPlayer2Name] = useState(matchState.leftTeam.player2?.name || '');
  const [rightPlayer1Name, setRightPlayer1Name] = useState(matchState.rightTeam.player1.name);
  const [rightPlayer2Name, setRightPlayer2Name] = useState(matchState.rightTeam.player2?.name || '');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isDoubles = isDoublesMatch(matchState);

  // Força orientação HORIZONTAL apenas na tela do placar
  useEffect(() => {
    const ensureLandscape = async () => {
      try {
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.LANDSCAPE
        );
      } catch (error) {
        console.log('Erro ao forçar orientação horizontal na tela de placar:', error);
      }
    };
    ensureLandscape();
  }, []);

  // Timer para atualizar o tempo de jogo
  useEffect(() => {
    if (matchState.isMatchStarted && !matchState.isMatchFinished) {
      timerRef.current = setInterval(() => {
        const newState = {
          ...matchState,
          elapsedTime: Date.now() - (matchState.matchStartTime || Date.now()),
        };
        onMatchUpdate(newState);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [matchState.isMatchStarted, matchState.isMatchFinished, matchState.matchStartTime]);

  // Salva automaticamente
  useEffect(() => {
    saveMatchState(matchState);
  }, [matchState]);

  const handleStartMatch = () => {
    const newState = {
      ...matchState,
      isMatchStarted: true,
      matchStartTime: Date.now(),
    };
    onMatchUpdate(newState);
  };

  const handleAddPoint = (team: 'left' | 'right') => {
    if (!matchState.isMatchStarted || matchState.isMatchFinished) return;
    const newState = addPoint(matchState, team);
    onMatchUpdate(newState);
    setMenuVisible(false);
  };

  const handleRemovePoint = () => {
    const newState = removeLastPoint(matchState);
    onMatchUpdate(newState);
  };

  const handleUpdatePlayers = () => {
    const newState = {
      ...matchState,
      leftTeam: { 
        ...matchState.leftTeam, 
        player1: { name: leftPlayer1Name },
        ...(isDoubles && { player2: { name: leftPlayer2Name } })
      },
      rightTeam: { 
        ...matchState.rightTeam, 
        player1: { name: rightPlayer1Name },
        ...(isDoubles && { player2: { name: rightPlayer2Name } })
      },
    };
    onMatchUpdate(newState);
    setEditPlayersVisible(false);
  };

  const handleFinishMatch = () => {
    Alert.alert(
      'Finalizar Partida',
      'Tem certeza que deseja finalizar a partida?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Finalizar',
          style: 'destructive',
          onPress: async () => {
            await clearMatchState();
            onFinishMatch();
            setMenuVisible(false);
          },
        },
      ]
    );
  };

  const handleNewMatch = () => {
    Alert.alert(
      'Nova Partida',
      'Tem certeza que deseja iniciar uma nova partida? Os dados atuais serão perdidos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Nova Partida',
          onPress: async () => {
            await clearMatchState();
            onNewMatch();
            setMenuVisible(false);
          },
        },
      ]
    );
  };

  const stats = getMatchStats(matchState);

  const renderSetScores = () => {
    return matchState.sets.map((set, index) => (
      <View key={index} style={styles.setScore}>
        <Text style={styles.setScoreText}>
          {set.left} - {set.right}
        </Text>
        <Text style={styles.setLabel}>Set {index + 1}</Text>
      </View>
    ));
  };

  const leftGameScore = getPointDisplay(
    matchState.isTiebreak ? matchState.tiebreakScore.left : matchState.gameScore.left,
    matchState.isTiebreak ? matchState.tiebreakScore.right : matchState.gameScore.right,
    matchState.isTiebreak
  );

  const rightGameScore = getPointDisplay(
    matchState.isTiebreak ? matchState.tiebreakScore.right : matchState.gameScore.right,
    matchState.isTiebreak ? matchState.tiebreakScore.left : matchState.gameScore.left,
    matchState.isTiebreak
  );

  return (
    <View style={styles.container}>
      {/* Header com tempo e menu */}
      <View style={styles.header}>
        <Text style={styles.timeText}>
          {formatTime(matchState.elapsedTime)} (TEMPO DE JOGO)
        </Text>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setMenuVisible(true)}
        >
          <Text style={styles.menuButtonText}>menu{'\n'}config</Text>
        </TouchableOpacity>
      </View>

      {/* Área principal do placar */}
      <View style={styles.scoreArea}>
        {/* Lado Esquerdo */}
        <View style={styles.teamSide}>
          <Text style={[styles.teamName, isDoubles && styles.doublesName]}>
            {getTeamDisplayName(matchState.leftTeam)}
          </Text>
          <Text style={styles.gameScore}>{leftGameScore}</Text>
          <View style={styles.setsContainer}>{renderSetScores().map((s, i) => (
            <Text key={i} style={styles.setScoreIndividual}>
              {matchState.sets[i]?.left ?? 0}
            </Text>
          ))}</View>
        </View>

        {/* Divisor Central */}
        <View style={styles.divider} />

        {/* Lado Direito */}
        <View style={styles.teamSide}>
          <Text style={[styles.teamName, isDoubles && styles.doublesName]}>
            {getTeamDisplayName(matchState.rightTeam)}
          </Text>
          <Text style={styles.gameScore}>{rightGameScore}</Text>
          <View style={styles.setsContainer}>{renderSetScores().map((s, i) => (
            <Text key={i} style={styles.setScoreIndividual}>
              {matchState.sets[i]?.right ?? 0}
            </Text>
          ))}</View>
        </View>
      </View>

      {/* Botão de iniciar partida */}
      {!matchState.isMatchStarted && (
        <TouchableOpacity style={styles.startButton} onPress={handleStartMatch}>
          <Text style={styles.startButtonText}>▶ INICIAR PARTIDA</Text>
        </TouchableOpacity>
      )}

      {/* Mensagem de partida finalizada */}
      {matchState.isMatchFinished && (
        <View style={styles.winnerBanner}>
          <Text style={styles.winnerText}>
            🏆 VENCEDOR: {matchState.winner === 'left' 
              ? getTeamDisplayName(matchState.leftTeam)
              : getTeamDisplayName(matchState.rightTeam)}
          </Text>
        </View>
      )}

      {/* Tiebreak indicator */}
      {matchState.isTiebreak && (
        <View style={styles.tiebreakBanner}>
          <Text style={styles.tiebreakText}>TIEBREAK</Text>
        </View>
      )}

      {/* Modal do Menu */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMenuVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.menuContainer}>
            <Text style={styles.menuTitle}>Menu de Configurações</Text>

            {matchState.isMatchStarted && !matchState.isMatchFinished && (
              <>
                <Text style={styles.sectionTitle}>Adicionar Ponto</Text>
                <View style={styles.pointButtonsRow}>
                  <TouchableOpacity
                    style={[styles.pointButton, styles.leftPointButton]}
                    onPress={() => handleAddPoint('left')}
                  >
                    <Text style={styles.pointButtonText}>
                      + {getTeamDisplayName(matchState.leftTeam)}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.pointButton, styles.rightPointButton]}
                    onPress={() => handleAddPoint('right')}
                  >
                    <Text style={styles.pointButtonText}>
                      + {getTeamDisplayName(matchState.rightTeam)}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.undoButton}
                  onPress={handleRemovePoint}
                >
                  <Text style={styles.undoButtonText}>↩ Desfazer Último Ponto</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                setStatsVisible(true);
              }}
            >
              <Text style={styles.menuItemText}>📊 Ver Estatísticas</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                setEditPlayersVisible(true);
              }}
            >
              <Text style={styles.menuItemText}>✏️ Editar Jogadores</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.dangerItem]}
              onPress={handleFinishMatch}
            >
              <Text style={styles.dangerItemText}>🏁 Finalizar Partida</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.dangerItem]}
              onPress={handleNewMatch}
            >
              <Text style={styles.dangerItemText}>🔄 Nova Partida</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setMenuVisible(false)}
            >
              <Text style={styles.closeButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Estatísticas */}
      <Modal
        visible={statsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setStatsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.statsContainer}>
            <Text style={styles.menuTitle}>📊 Estatísticas da Partida</Text>
            
            <View style={styles.statsRow}>
              <Text style={styles.statsLabel}>Total de Pontos:</Text>
              <Text style={styles.statsValue}>{stats.totalPoints}</Text>
            </View>
            
            <View style={styles.statsRow}>
              <Text style={styles.statsLabel}>{getTeamDisplayName(matchState.leftTeam)}:</Text>
              <Text style={styles.statsValue}>{stats.leftPointsCount} pontos</Text>
            </View>
            
            <View style={styles.statsRow}>
              <Text style={styles.statsLabel}>{getTeamDisplayName(matchState.rightTeam)}:</Text>
              <Text style={styles.statsValue}>{stats.rightPointsCount} pontos</Text>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Histórico de Pontos</Text>
            
            <ScrollView style={styles.historyList}>
              {stats.pointsByMinute.map((point, index) => (
                <View key={point.id} style={styles.historyItem}>
                  <Text style={styles.historyMinute}>{point.minute}</Text>
                  <Text style={[
                    styles.historyTeam,
                    point.team === 'left' ? styles.leftTeamColor : styles.rightTeamColor
                  ]}>
                    {point.team === 'left' 
                      ? getTeamDisplayName(matchState.leftTeam)
                      : getTeamDisplayName(matchState.rightTeam)}
                  </Text>
                  <Text style={styles.historyScore}>
                    ({point.setScore.left}-{point.setScore.right}) {point.gameScore.left}-{point.gameScore.right}
                  </Text>
                </View>
              ))}
              {stats.pointsByMinute.length === 0 && (
                <Text style={styles.noHistoryText}>Nenhum ponto registrado ainda</Text>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setStatsVisible(false)}
            >
              <Text style={styles.closeButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Editar Jogadores */}
      <Modal
        visible={editPlayersVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditPlayersVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editContainer}>
            <Text style={styles.menuTitle}>✏️ Editar {isDoubles ? 'Times' : 'Jogadores'}</Text>
            
            <Text style={styles.inputLabel}>{isDoubles ? 'Time' : 'Jogador'} Esquerdo</Text>
            <TextInput
              style={styles.editInput}
              value={leftPlayer1Name}
              onChangeText={setLeftPlayer1Name}
              placeholder={isDoubles ? "Jogador 1" : "Nome do jogador"}
              placeholderTextColor="#666"
            />
            {isDoubles && (
              <TextInput
                style={[styles.editInput, { marginTop: 8 }]}
                value={leftPlayer2Name}
                onChangeText={setLeftPlayer2Name}
                placeholder="Jogador 2"
                placeholderTextColor="#666"
              />
            )}
            
            <Text style={styles.inputLabel}>{isDoubles ? 'Time' : 'Jogador'} Direito</Text>
            <TextInput
              style={styles.editInput}
              value={rightPlayer1Name}
              onChangeText={setRightPlayer1Name}
              placeholder={isDoubles ? "Jogador 1" : "Nome do jogador"}
              placeholderTextColor="#666"
            />
            {isDoubles && (
              <TextInput
                style={[styles.editInput, { marginTop: 8 }]}
                value={rightPlayer2Name}
                onChangeText={setRightPlayer2Name}
                placeholder="Jogador 2"
                placeholderTextColor="#666"
              />
            )}

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleUpdatePlayers}
            >
              <Text style={styles.saveButtonText}>Salvar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setEditPlayersVisible(false)}
            >
              <Text style={styles.closeButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingTop: screenHeight * 0.015,
    paddingHorizontal: screenWidth * 0.05,
    position: 'relative',
  },
  timeText: {
    color: '#d4a500',
    fontSize: Math.min(screenWidth * 0.035, 14),
    fontWeight: 'bold',
  },
  menuButton: {
    position: 'absolute',
    right: screenWidth * 0.05,
    top: screenHeight * 0.015,
  },
  menuButtonText: {
    color: '#e94560',
    fontSize: Math.min(screenWidth * 0.03, 12),
    textAlign: 'right',
    fontWeight: 'bold',
  },
  scoreArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamSide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamName: {
    fontSize: Math.min(screenWidth * 0.04, 16),
    color: '#333',
    marginBottom: screenHeight * 0.015,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: screenWidth * 0.02,
  },
  doublesName: {
    fontSize: Math.min(screenWidth * 0.035, 14),
    lineHeight: 18,
  },
  gameScore: {
    fontSize: Math.min(screenWidth * 0.25, screenHeight * 0.2, 120),
    fontWeight: '300',
    color: '#000',
    fontStyle: 'italic',
  },
  setsContainer: {
    flexDirection: 'row',
    marginTop: screenHeight * 0.015,
    gap: screenWidth * 0.04,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  setScoreIndividual: {
    fontSize: Math.min(screenWidth * 0.06, 24),
    color: '#666',
    fontWeight: 'bold',
  },
  setScore: {
    alignItems: 'center',
  },
  setScoreText: {
    fontSize: Math.min(screenWidth * 0.045, 18),
    color: '#333',
    fontWeight: 'bold',
  },
  setLabel: {
    fontSize: Math.min(screenWidth * 0.025, 10),
    color: '#999',
  },
  divider: {
    width: 2,
    height: '80%',
    backgroundColor: '#000',
  },
  startButton: {
    position: 'absolute',
    bottom: screenHeight * 0.04,
    alignSelf: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: screenHeight * 0.02,
    paddingHorizontal: screenWidth * 0.08,
    borderRadius: 10,
  },
  startButtonText: {
    color: '#fff',
    fontSize: Math.min(screenWidth * 0.04, 16),
    fontWeight: 'bold',
  },
  winnerBanner: {
    position: 'absolute',
    bottom: screenHeight * 0.04,
    left: screenWidth * 0.05,
    right: screenWidth * 0.05,
    backgroundColor: '#FFD700',
    paddingVertical: screenHeight * 0.02,
    borderRadius: 10,
    alignItems: 'center',
  },
  winnerText: {
    fontSize: Math.min(screenWidth * 0.045, 18),
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  tiebreakBanner: {
    position: 'absolute',
    top: screenHeight * 0.06,
    alignSelf: 'center',
    backgroundColor: '#e94560',
    paddingVertical: screenHeight * 0.008,
    paddingHorizontal: screenWidth * 0.05,
    borderRadius: 5,
  },
  tiebreakText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: Math.min(screenWidth * 0.03, 12),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: '#1a1a2e',
    borderRadius: 15,
    padding: screenWidth * 0.05,
    width: '80%',
    maxWidth: Math.min(screenWidth * 0.8, 400),
    maxHeight: '80%',
  },
  menuTitle: {
    color: '#fff',
    fontSize: Math.min(screenWidth * 0.05, 20),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: screenHeight * 0.025,
  },
  sectionTitle: {
    color: '#aaa',
    fontSize: Math.min(screenWidth * 0.035, 14),
    marginBottom: screenHeight * 0.015,
  },
  pointButtonsRow: {
    flexDirection: 'row',
    gap: screenWidth * 0.025,
    marginBottom: screenHeight * 0.02,
  },
  pointButton: {
    flex: 1,
    paddingVertical: screenHeight * 0.02,
    borderRadius: 10,
    alignItems: 'center',
  },
  leftPointButton: {
    backgroundColor: '#2196F3',
  },
  rightPointButton: {
    backgroundColor: '#4CAF50',
  },
  pointButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: Math.min(screenWidth * 0.035, 14),
    textAlign: 'center',
  },
  undoButton: {
    backgroundColor: '#666',
    paddingVertical: screenHeight * 0.015,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: screenHeight * 0.025,
  },
  undoButtonText: {
    color: '#fff',
    fontSize: Math.min(screenWidth * 0.035, 14),
  },
  menuItem: {
    backgroundColor: '#16213e',
    paddingVertical: screenHeight * 0.02,
    paddingHorizontal: screenWidth * 0.05,
    borderRadius: 10,
    marginBottom: screenHeight * 0.015,
  },
  menuItemText: {
    color: '#fff',
    fontSize: Math.min(screenWidth * 0.04, 16),
  },
  dangerItem: {
    backgroundColor: '#3d1a1a',
  },
  dangerItemText: {
    color: '#e94560',
    fontSize: Math.min(screenWidth * 0.04, 16),
  },
  closeButton: {
    marginTop: screenHeight * 0.015,
    paddingVertical: screenHeight * 0.02,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#aaa',
    fontSize: Math.min(screenWidth * 0.04, 16),
  },
  statsContainer: {
    backgroundColor: '#1a1a2e',
    borderRadius: 15,
    padding: screenWidth * 0.05,
    width: '90%',
    maxWidth: Math.min(screenWidth * 0.9, 500),
    maxHeight: '85%',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: screenHeight * 0.015,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  statsLabel: {
    color: '#aaa',
    fontSize: Math.min(screenWidth * 0.035, 14),
    flex: 1,
  },
  statsValue: {
    color: '#fff',
    fontSize: Math.min(screenWidth * 0.035, 14),
    fontWeight: 'bold',
  },
  historyList: {
    maxHeight: screenHeight * 0.25,
    marginTop: screenHeight * 0.015,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: screenHeight * 0.012,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    gap: screenWidth * 0.025,
  },
  historyMinute: {
    color: '#d4a500',
    fontSize: Math.min(screenWidth * 0.03, 12),
    fontWeight: 'bold',
    width: screenWidth * 0.1,
  },
  historyTeam: {
    fontSize: Math.min(screenWidth * 0.03, 12),
    flex: 1,
  },
  leftTeamColor: {
    color: '#2196F3',
  },
  rightTeamColor: {
    color: '#4CAF50',
  },
  historyScore: {
    color: '#888',
    fontSize: Math.min(screenWidth * 0.028, 11),
  },
  noHistoryText: {
    color: '#666',
    textAlign: 'center',
    paddingVertical: screenHeight * 0.025,
  },
  editContainer: {
    backgroundColor: '#1a1a2e',
    borderRadius: 15,
    padding: screenWidth * 0.05,
    width: '80%',
    maxWidth: Math.min(screenWidth * 0.8, 400),
  },
  inputLabel: {
    color: '#aaa',
    fontSize: Math.min(screenWidth * 0.035, 14),
    marginBottom: screenHeight * 0.008,
    marginTop: screenHeight * 0.02,
  },
  editInput: {
    backgroundColor: '#16213e',
    color: '#fff',
    paddingVertical: screenHeight * 0.015,
    paddingHorizontal: screenWidth * 0.04,
    borderRadius: 10,
    fontSize: Math.min(screenWidth * 0.04, 16),
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: screenHeight * 0.02,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: screenHeight * 0.025,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: Math.min(screenWidth * 0.04, 16),
    fontWeight: 'bold',
  },
});
