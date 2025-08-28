import React, { useEffect } from 'react';
import { View, FlatList, SafeAreaView, Text, StyleSheet } from 'react-native';
import StreakCounter from '../components/StreakCounter';
import HabitItem from '../components/HabitItem';
import Glow from '../components/Glow';
import Header from '../components/Header';
import { habits } from '../constants/habits';
import { useAppStore } from '../state/useAppStore';
import { useAppStateSync } from '../hooks/useAppStateSync';
import { palette } from '../theme/palette';
import { metrics } from '../theme/metrics';

const HomeScreen: React.FC = () => {
  const { state, toggleHabit, init } = useAppStore();
  useAppStateSync();

  useEffect(() => {
    init();
  }, [init]);

  return (
    <SafeAreaView style={styles.safe}>
      <Glow />
      <Header />
      <View style={styles.container}>
        <StreakCounter streak={state.streak} />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today</Text>
          <FlatList
            data={habits}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <HabitItem
                label={item.label}
                checked={state.habits[item.id]}
                onToggle={() => toggleHabit(item.id)}
              />
            )}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  container: { flex: 1, padding: metrics.pad, gap: metrics.gap },
  section: {
    backgroundColor: palette.card,
    borderRadius: metrics.radiusXL,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    padding: metrics.pad,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  sectionTitle: {
    color: palette.textDim,
    fontSize: 14,
    marginBottom: metrics.gap,
    letterSpacing: 0.5,
  },
});

export default HomeScreen;
