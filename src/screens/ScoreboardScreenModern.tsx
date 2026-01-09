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
  Animated,
  StatusBar,
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
  const pulseAnim = useRef(new Animated.Value(1)).current;
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

  // Animação de pulso para elementos importantes
  useEffect(() => {
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => pulse());
    };
    if (matchState.isMatchStarted && !matchState.isMatchFinished) {
      pulse();
    }
  }, [matchState.isMatchStarted, matchState.isMatchFinished]);

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
      'Finish Match',
      'Are you sure you want to finish this match?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finish',
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
      'New Match',
      'Start a new match? Current data will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'New Match',
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
      <StatusBar hidden />
      
      {/* Background Gradient */}
      <View style={styles.backgroundGradient} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.timeContainer}>
          <Animated.View style={[styles.timeBox, { transform: [{ scale: pulseAnim }] }]}>
            <Text style={styles.timeLabel}>MATCH TIME</Text>
            <Text style={styles.timeText}>{formatTime(matchState.elapsedTime)}</Text>
          </Animated.View>
        </View>
        
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setMenuVisible(true)}
        >
          <View style={styles.menuIcon}>
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
          </View>
          <Text style={styles.menuButtonText}>MENU</Text>
        </TouchableOpacity>
      </View>

      {/* Tiebreak Banner */}
      {matchState.isTiebreak && (
        <Animated.View style={[styles.tiebreakBanner, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.tiebreakText}>⚡ TIEBREAK ⚡</Text>
        </Animated.View>
      )}

      {/* Main Score Area */}
      <View style={styles.scoreArea}>
        {/* Left Team */}
        <View style={styles.leftTeamSide}>
          <View style={styles.teamHeader}>
            <Text style={styles.teamName}>{getTeamDisplayName(matchState.leftTeam)}</Text>
          </View>
          
          <View style={styles.scoreContainer}>
            <Text style={styles.gameScore}>{leftGameScore}</Text>
          </View>
          
          <View style={styles.setsContainer}>
            {matchState.sets.map((set, index) => (
              <View key={index} style={styles.setBox}>
                <Text style={styles.setScore}>{set.left}</Text>
                <Text style={styles.setLabel}>SET {index + 1}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Center Divider */}
        <View style={styles.centerLine}>
          <View style={styles.divider} />
          <View style={styles.vsCircle}>
            <Text style={styles.vsText}>VS</Text>
          </View>
        </View>

        {/* Right Team */}
        <View style={styles.rightTeamSide}>
          <View style={styles.teamHeader}>
            <Text style={styles.teamName}>{getTeamDisplayName(matchState.rightTeam)}</Text>
          </View>
          
          <View style={styles.scoreContainer}>
            <Text style={styles.gameScore}>{rightGameScore}</Text>
          </View>
          
          <View style={styles.setsContainer}>
            {matchState.sets.map((set, index) => (
              <View key={index} style={styles.setBox}>
                <Text style={styles.setScore}>{set.right}</Text>
                <Text style={styles.setLabel}>SET {index + 1}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Start Button */}
      {!matchState.isMatchStarted && (
        <TouchableOpacity style={styles.startButton} onPress={handleStartMatch}>
          <Text style={styles.startButtonText}>🏁 START MATCH</Text>
        </TouchableOpacity>
      )}

      {/* Winner Banner */}
      {matchState.isMatchFinished && (
        <Animated.View style={[styles.winnerBanner, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.winnerText}>
            🏆 CHAMPION: {matchState.winner === 'left' 
              ? getTeamDisplayName(matchState.leftTeam)
              : getTeamDisplayName(matchState.rightTeam)}
          </Text>
        </Animated.View>
      )}

      {/* Modals... (keeping same structure but with new styling) */}
      {/* I'll add the modals with new styling in the next part */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0f0f23',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: screenHeight * 0.03,
    paddingHorizontal: screenWidth * 0.04,
    paddingBottom: screenHeight * 0.02,
  },
  timeContainer: {
    flex: 1,
    alignItems: 'center',
  },
  timeBox: {
    backgroundColor: 'rgba(52, 152, 219, 0.15)',
    borderColor: '#3498db',
    borderWidth: 2,
    borderRadius: 15,
    paddingVertical: 8,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  timeLabel: {
    color: '#3498db',
    fontSize: Math.min(screenWidth * 0.025, 12),
    fontWeight: '700',
    letterSpacing: 1,
  },
  timeText: {
    color: '#fff',
    fontSize: Math.min(screenWidth * 0.04, 18),
    fontWeight: '900',
    marginTop: 2,
  },
  menuButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(231, 76, 60, 0.15)',
    borderColor: '#e74c3c',
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  menuIcon: {
    width: 20,
    height: 14,
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  menuLine: {
    height: 2,
    backgroundColor: '#e74c3c',
    borderRadius: 1,
  },
  menuButtonText: {
    color: '#e74c3c',
    fontSize: Math.min(screenWidth * 0.022, 10),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tiebreakBanner: {
    position: 'absolute',
    top: screenHeight * 0.15,
    alignSelf: 'center',
    backgroundColor: 'rgba(230, 126, 34, 0.9)',
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 20,
    shadowColor: '#e67e22',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 10,
  },
  tiebreakText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: Math.min(screenWidth * 0.03, 14),
    letterSpacing: 1,
  },
  scoreArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: screenWidth * 0.02,
  },
  leftTeamSide: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(231, 76, 60, 0.05)',
    borderRadius: 25,
    padding: screenWidth * 0.02,
    marginRight: screenWidth * 0.01,
    borderLeftColor: '#e74c3c',
    borderLeftWidth: 4,
  },
  rightTeamSide: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(52, 152, 219, 0.05)',
    borderRadius: 25,
    padding: screenWidth * 0.02,
    marginLeft: screenWidth * 0.01,
    borderRightColor: '#3498db',
    borderRightWidth: 4,
  },
  teamHeader: {
    marginBottom: screenHeight * 0.02,
  },
  teamName: {
    fontSize: Math.min(screenWidth * 0.035, 16),
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scoreContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    paddingVertical: screenHeight * 0.04,
    paddingHorizontal: screenWidth * 0.06,
    marginBottom: screenHeight * 0.03,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  gameScore: {
    fontSize: Math.min(screenWidth * 0.15, screenHeight * 0.25, 100),
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  setsContainer: {
    flexDirection: 'row',
    gap: screenWidth * 0.02,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  setBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    minWidth: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  setScore: {
    fontSize: Math.min(screenWidth * 0.04, 18),
    color: '#fff',
    fontWeight: '800',
  },
  setLabel: {
    fontSize: Math.min(screenWidth * 0.02, 9),
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600',
    marginTop: 2,
  },
  centerLine: {
    alignItems: 'center',
    justifyContent: 'center',
    width: screenWidth * 0.08,
  },
  divider: {
    width: 3,
    height: '70%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  vsCircle: {
    position: 'absolute',
    backgroundColor: 'rgba(155, 89, 182, 0.2)',
    borderColor: '#9b59b6',
    borderWidth: 3,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#9b59b6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  vsText: {
    color: '#9b59b6',
    fontSize: Math.min(screenWidth * 0.025, 12),
    fontWeight: '900',
    letterSpacing: 1,
  },
  startButton: {
    position: 'absolute',
    bottom: screenHeight * 0.05,
    alignSelf: 'center',
    backgroundColor: '#27ae60',
    paddingVertical: screenHeight * 0.025,
    paddingHorizontal: screenWidth * 0.08,
    borderRadius: 25,
    shadowColor: '#27ae60',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
  },
  startButtonText: {
    color: '#fff',
    fontSize: Math.min(screenWidth * 0.04, 18),
    fontWeight: '900',
    letterSpacing: 1,
  },
  winnerBanner: {
    position: 'absolute',
    bottom: screenHeight * 0.05,
    left: screenWidth * 0.05,
    right: screenWidth * 0.05,
    backgroundColor: 'rgba(241, 196, 15, 0.95)',
    paddingVertical: screenHeight * 0.03,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#f1c40f',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 12,
    borderWidth: 3,
    borderColor: '#f39c12',
  },
  winnerText: {
    fontSize: Math.min(screenWidth * 0.04, 20),
    fontWeight: '900',
    color: '#000',
    textAlign: 'center',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});