import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import dayjs from 'dayjs';
import { useHabitStore } from '../store/habits';
import HabitItem from '../components/HabitItem';
import StreakCounter from '../components/StreakCounter';
import { palette } from '../theme/palette';
import { metrics } from '../theme/metrics';

export default function TodayScreen() {
  const iso = dayjs().format('YYYY-MM-DD');
  const dayView = useHabitStore((s) => s.dayView);
  const logStatus = useHabitStore((s) => s.logStatus);
  const { due, logs } = dayView(iso);

  const statusOf = (id: string) => logs.find((l) => l.habitId === id)?.status ?? 'pending';

  // Compute a basic streak from logs of consecutive full days completed (simple placeholder)
  const streak = React.useMemo(() => {
    // This app previously had a different streak logic; keep simple for now.
    // Count last N consecutive days where all due were completed.
    let s = 0;
    for (let i = 0; i < 365; i++) {
      const d = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
      const { due: dd, logs: ll } = dayView(d);
      if (dd.length === 0) continue; // ignore days with no due
      const ok = dd.every((h) => ll.find((l) => l.habitId === h.id)?.status === 'completed');
      if (ok) s += 1; else break;
    }
    return s;
  }, [dayView, logs]);

  return (
    <View style={styles.container}>
      <StreakCounter streak={streak} />
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today</Text>
        <FlatList
          data={due}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <HabitItem
              label={item.name}
              checked={statusOf(item.id) === 'completed'}
              onToggle={() => {
                const next = statusOf(item.id) === 'completed' ? 'pending' : 'completed';
                logStatus(item.id, iso, next);
              }}
            />
          )}
          ListEmptyComponent={<Text style={styles.empty}>No habits due today.</Text>}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: metrics.pad, gap: metrics.gap },
  section: {
    backgroundColor: palette.card,
    borderRadius: metrics.radiusXL,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    padding: metrics.pad,
  },
  sectionTitle: { color: palette.textDim, fontSize: 14, marginBottom: metrics.gap, letterSpacing: 0.5 },
  empty: { color: palette.textDim, paddingVertical: metrics.pad },
});

