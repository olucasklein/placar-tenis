import React, { useState, useEffect } from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { PlayerSetupScreen as SetupScreen } from './src/screens/SetupScreen';
import { ScoreboardScreen } from './src/screens/GameScreen';
import { MatchState } from './src/types';
import { loadMatchState, saveMatchState, clearMatchState } from './src/utils/storage';

type AppScreen = 'setup' | 'scoreboard';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('setup');
  const [matchState, setMatchState] = useState<MatchState | null>(null);
  const [existingMatch, setExistingMatch] = useState<MatchState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Remove forçar orientação no App principal
  // Deixa cada tela decidir sua orientação
  useEffect(() => {
    // App principal não força orientação específica
  }, []);

  // Carrega partida salva
  useEffect(() => {
    async function loadSavedMatch() {
      const saved = await loadMatchState();
      if (saved && !saved.isMatchFinished) {
        setExistingMatch(saved);
      }
      setIsLoading(false);
    }
    loadSavedMatch();
  }, []);

  const handleStartMatch = (newMatch: MatchState) => {
    setMatchState(newMatch);
    setCurrentScreen('scoreboard');
    saveMatchState(newMatch);
  };

  const handleContinueMatch = () => {
    if (existingMatch) {
      setMatchState(existingMatch);
      setCurrentScreen('scoreboard');
    }
  };

  const handleMatchUpdate = (updatedMatch: MatchState) => {
    setMatchState(updatedMatch);
    saveMatchState(updatedMatch);
  };

  const handleFinishMatch = async () => {
    await clearMatchState();
    setMatchState(null);
    setExistingMatch(null);
    setCurrentScreen('setup');
  };

  const handleNewMatch = async () => {
    await clearMatchState();
    setMatchState(null);
    setExistingMatch(null);
    setCurrentScreen('setup');
  };

  if (isLoading) {
    return <View style={styles.loadingContainer} />;
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      {currentScreen === 'setup' && (
        <SetupScreen
          onStartMatch={handleStartMatch}
          existingMatch={existingMatch}
          onContinueMatch={handleContinueMatch}
        />
      )}
      {currentScreen === 'scoreboard' && matchState && (
        <ScoreboardScreen
          matchState={matchState}
          onMatchUpdate={handleMatchUpdate}
          onFinishMatch={handleFinishMatch}
          onNewMatch={handleNewMatch}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
