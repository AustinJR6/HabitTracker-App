import React, { useEffect } from 'react';
import { View, FlatList } from 'react-native';
import StreakCounter from '../components/StreakCounter';
import HabitItem from '../components/HabitItem';
import { habits } from '../constants/habits';
import { useAppStore } from '../state/useAppStore';
import { useAppStateSync } from '../hooks/useAppStateSync';

const HomeScreen: React.FC = () => {
  const { state, toggleHabit, init } = useAppStore();
  useAppStateSync();

  useEffect(() => {
    init();
  }, [init]);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <StreakCounter streak={state.streak} />
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
  );
};

export default HomeScreen;
