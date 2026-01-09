import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { MatchState } from '../types';
import { createInitialMatchState } from '../utils/matchLogic';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
  const [isDoubles, setIsDoubles] = useState(false);
  const [leftPlayer1, setLeftPlayer1] = useState('');
  const [leftPlayer2, setLeftPlayer2] = useState('');
  const [rightPlayer1, setRightPlayer1] = useState('');
  const [rightPlayer2, setRightPlayer2] = useState('');
  const [setsToWin, setSetsToWin] = useState(2);

  // Força orientação VERTICAL para o menu inicial
  useEffect(() => {
    const ensurePortrait = async () => {
      try {
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT_UP
        );
      } catch (error) {
        console.log('Erro ao forçar orientação vertical:', error);
      }
    };
    ensurePortrait();
  }, []);

  const handleStartMatch = () => {
    const leftTeamName = isDoubles 
      ? `${leftPlayer1.trim()} / ${leftPlayer2.trim()}`
      : leftPlayer1.trim();
    
    const rightTeamName = isDoubles 
      ? `${rightPlayer1.trim()} / ${rightPlayer2.trim()}`
      : rightPlayer1.trim();

    if (!leftPlayer1.trim() || !rightPlayer1.trim()) {
      return;
    }

    if (isDoubles && (!leftPlayer2.trim() || !rightPlayer2.trim())) {
      return;
    }

    const matchState = createInitialMatchState(
      leftTeamName,
      rightTeamName,
      setsToWin
    );

    // Adicionar jogadores individuais se for duplas
    if (isDoubles) {
      matchState.leftTeam.player2 = { name: leftPlayer2.trim() };
      matchState.rightTeam.player2 = { name: rightPlayer2.trim() };
    }

    onStartMatch(matchState);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>🎾 Placar de Tênis</Text>
        <Text style={styles.subtitle}>Configure a partida</Text>

        {existingMatch && !existingMatch.isMatchFinished && onContinueMatch && (
          <TouchableOpacity
            style={styles.continueButton}
            onPress={onContinueMatch}
          >
            <Text style={styles.continueButtonText}>
              Continuar Partida em Andamento
            </Text>
            <Text style={styles.continueSubtext}>
              {existingMatch.leftTeam.player1.name} vs {existingMatch.rightTeam.player1.name}
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.matchTypeSection}>
          <Text style={styles.label}>Tipo de Partida</Text>
          <View style={styles.matchTypeSelector}>
            <TouchableOpacity
              style={[
                styles.matchTypeOption,
                !isDoubles && styles.matchTypeOptionSelected,
              ]}
              onPress={() => setIsDoubles(false)}
            >
              <Text
                style={[
                  styles.matchTypeOptionText,
                  !isDoubles && styles.matchTypeOptionTextSelected,
                ]}
              >
                Simples (1v1)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.matchTypeOption,
                isDoubles && styles.matchTypeOptionSelected,
              ]}
              onPress={() => setIsDoubles(true)}
            >
              <Text
                style={[
                  styles.matchTypeOptionText,
                  isDoubles && styles.matchTypeOptionTextSelected,
                ]}
              >
                Duplas (2v2)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.playersContainer}>
          <View style={styles.teamInput}>
            <Text style={styles.label}>{isDoubles ? 'Time' : 'Jogador'} Esquerdo</Text>
            <TextInput
              style={styles.input}
              placeholder={isDoubles ? 'Jogador 1' : 'Nome do jogador'}
              placeholderTextColor="#999"
              value={leftPlayer1}
              onChangeText={setLeftPlayer1}
            />
            {isDoubles && (
              <TextInput
                style={[styles.input, { marginTop: 8 }]}
                placeholder="Jogador 2"
                placeholderTextColor="#999"
                value={leftPlayer2}
                onChangeText={setLeftPlayer2}
              />
            )}
          </View>

          <Text style={styles.vs}>VS</Text>

          <View style={styles.teamInput}>
            <Text style={styles.label}>{isDoubles ? 'Time' : 'Jogador'} Direito</Text>
            <TextInput
              style={styles.input}
              placeholder={isDoubles ? 'Jogador 1' : 'Nome do jogador'}
              placeholderTextColor="#999"
              value={rightPlayer1}
              onChangeText={setRightPlayer1}
            />
            {isDoubles && (
              <TextInput
                style={[styles.input, { marginTop: 8 }]}
                placeholder="Jogador 2"
                placeholderTextColor="#999"
                value={rightPlayer2}
                onChangeText={setRightPlayer2}
              />
            )}
          </View>
        </View>

        <View style={styles.configSection}>
          <Text style={styles.label}>Formato da Partida</Text>
          <View style={styles.setsSelector}>
            <TouchableOpacity
              style={[
                styles.setOption,
                setsToWin === 2 && styles.setOptionSelected,
              ]}
              onPress={() => setSetsToWin(2)}
            >
              <Text
                style={[
                  styles.setOptionText,
                  setsToWin === 2 && styles.setOptionTextSelected,
                ]}
              >
                Melhor de 3
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.setOption,
                setsToWin === 3 && styles.setOptionSelected,
              ]}
              onPress={() => setSetsToWin(3)}
            >
              <Text
                style={[
                  styles.setOptionText,
                  setsToWin === 3 && styles.setOptionTextSelected,
                ]}
              >
                Melhor de 5
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.startButton,
            (!leftPlayer1.trim() || !rightPlayer1.trim() || 
             (isDoubles && (!leftPlayer2.trim() || !rightPlayer2.trim()))) && styles.startButtonDisabled,
          ]}
          onPress={handleStartMatch}
          disabled={!leftPlayer1.trim() || !rightPlayer1.trim() || 
                    (isDoubles && (!leftPlayer2.trim() || !rightPlayer2.trim()))}
        >
          <Text style={styles.startButtonText}>Iniciar Partida</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: screenWidth * 0.08,
    paddingVertical: screenHeight * 0.03,
  },
  title: {
    fontSize: Math.min(screenWidth * 0.1, 36),
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: screenHeight * 0.015,
  },
  subtitle: {
    fontSize: Math.min(screenWidth * 0.045, 18),
    color: '#aaa',
    marginBottom: screenHeight * 0.05,
  },
  continueButton: {
    backgroundColor: '#16213e',
    padding: screenHeight * 0.02,
    borderRadius: 10,
    marginBottom: screenHeight * 0.025,
    width: '100%',
    maxWidth: screenWidth * 0.8,
    borderWidth: 2,
    borderColor: '#e94560',
  },
  continueButtonText: {
    color: '#e94560',
    fontSize: Math.min(screenWidth * 0.04, 16),
    fontWeight: 'bold',
    textAlign: 'center',
  },
  continueSubtext: {
    color: '#888',
    fontSize: Math.min(screenWidth * 0.03, 12),
    textAlign: 'center',
    marginTop: 5,
  },
  playersContainer: {
    flexDirection: 'column', // Vertical para portrait
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: screenWidth * 0.85,
    marginBottom: screenHeight * 0.04,
    gap: screenHeight * 0.025,
  },
  teamInput: {
    width: '100%',
    alignItems: 'center',
  },
  matchTypeSection: {
    width: '100%',
    maxWidth: screenWidth * 0.8,
    marginBottom: screenHeight * 0.025,
  },
  matchTypeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  matchTypeOption: {
    backgroundColor: '#16213e',
    paddingVertical: screenHeight * 0.015,
    paddingHorizontal: screenWidth * 0.05,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  matchTypeOptionSelected: {
    backgroundColor: '#0f3460',
    borderColor: '#e94560',
  },
  matchTypeOptionText: {
    color: '#aaa',
    fontSize: Math.min(screenWidth * 0.035, 14),
  },
  matchTypeOptionTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  playerInput: {
    width: '100%',
    alignItems: 'center',
  },
  label: {
    color: '#fff',
    fontSize: Math.min(screenWidth * 0.045, 16),
    marginBottom: 8,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#16213e',
    color: '#fff',
    paddingVertical: screenHeight * 0.02,
    paddingHorizontal: screenWidth * 0.05,
    borderRadius: 10,
    fontSize: Math.min(screenWidth * 0.045, 18),
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#0f3460',
    width: '100%',
    minWidth: screenWidth * 0.7,
  },
  vs: {
    color: '#e94560',
    fontSize: Math.min(screenWidth * 0.08, 28),
    fontWeight: 'bold',
    marginVertical: screenHeight * 0.02,
    textAlign: 'center',
  },
  configSection: {
    width: '100%',
    maxWidth: screenWidth * 0.8,
    marginBottom: screenHeight * 0.04,
  },
  setsSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  setOption: {
    backgroundColor: '#16213e',
    paddingVertical: screenHeight * 0.015,
    paddingHorizontal: screenWidth * 0.06,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  setOptionSelected: {
    backgroundColor: '#0f3460',
    borderColor: '#e94560',
  },
  setOptionText: {
    color: '#aaa',
    fontSize: Math.min(screenWidth * 0.035, 14),
  },
  setOptionTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  startButton: {
    backgroundColor: '#e94560',
    paddingVertical: screenHeight * 0.02,
    paddingHorizontal: screenWidth * 0.12,
    borderRadius: 10,
  },
  startButtonDisabled: {
    backgroundColor: '#444',
  },
  startButtonText: {
    color: '#fff',
    fontSize: Math.min(screenWidth * 0.045, 18),
    fontWeight: 'bold',
  },
});
