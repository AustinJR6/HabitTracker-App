import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import HabitForm from '../components/HabitForm';
import { palette } from '../theme/palette';
import { metrics } from '../theme/metrics';

export default function AddHabitScreen() {
  return (
    <View style={styles.container}>
      <HabitForm onSaved={() => Alert.alert('Saved', 'Habit added.')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: metrics.pad, gap: metrics.gap, backgroundColor: 'transparent' },
});

