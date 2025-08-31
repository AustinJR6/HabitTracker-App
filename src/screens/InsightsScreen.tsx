import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import dayjs from 'dayjs';
import { VictoryBar, VictoryChart, VictoryTheme, VictoryAxis } from 'victory-native';
import { getHabitsV2, getLogsByDateV2 } from '../services/storageV2';
import { HabitV2 } from '../types/v2';
import { useOverallStreakV2, usePerHabitStreaksV2 } from '../hooks/useStreaksV2';
import Screen from '../components/Screen';
import { useHabitsV2 } from '../hooks/useHabitsV2';
import { palette } from '../theme/palette';
import { metrics } from '../theme/metrics';

type Totals = { [habitId: string]: number };
type BadgeCounts = { [habitId: string]: Record<string, number> };

async function collectRange(ymdFrom: string, ymdTo: string) {
  const habits = await getHabitsV2();
  const totals: Totals = {};
  const badgeCounts: BadgeCounts = {};
  for (let d = dayjs(ymdFrom); d.isBefore(dayjs(ymdTo)) || d.isSame(ymdTo, 'day'); d = d.add(1, 'day')) {
    const ymd = d.format('YYYY-MM-DD');
    const logs = await getLogsByDateV2(ymd);
    for (const l of logs) {
      totals[l.habitId] = (totals[l.habitId] ?? 0) + (l.duration || 0);
      if (l.badge) {
        badgeCounts[l.habitId] = badgeCounts[l.habitId] || {};
        badgeCounts[l.habitId][l.badge] = (badgeCounts[l.habitId][l.badge] ?? 0) + 1;
      }
    }
  }
  return { habits, totals, badgeCounts };
}

export default function InsightsScreen() {
  const [mode, setMode] = React.useState<'week'|'month'>('week');
  const [habits, setHabits] = React.useState<HabitV2[]>([]);
  const [totals, setTotals] = React.useState<Totals>({});
  const [badgeCounts, setBadgeCounts] = React.useState<BadgeCounts>({});
  const { refreshKey } = useHabitsV2();
  const streaks = usePerHabitStreaksV2(habits, refreshKey);
  const overall = useOverallStreakV2(habits, refreshKey);

  React.useEffect(() => {
    (async () => {
      const to = dayjs().format('YYYY-MM-DD');
      const from = dayjs().subtract(mode === 'week' ? 6 : 29, 'day').format('YYYY-MM-DD');
      const { habits, totals, badgeCounts } = await collectRange(from, to);
      setHabits(habits); setTotals(totals); setBadgeCounts(badgeCounts);
    })();
  }, [mode]);

  const data = habits.map(h => ({ habit: h.name, minutes: totals[h.habitId] ?? 0 })).filter(x => x.minutes > 0);

  return (
    <Screen style={styles.container}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={styles.sectionTitle}>Insights ({mode})</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable onPress={() => setMode('week')} style={[styles.pill, mode==='week' && styles.pillActive]}><Text style={styles.pillText}>Week</Text></Pressable>
          <Pressable onPress={() => setMode('month')} style={[styles.pill, mode==='month' && styles.pillActive]}><Text style={styles.pillText}>Month</Text></Pressable>
        </View>
      </View>
      <Text style={styles.row}>Overall streak: {overall} day(s)</Text>
      {data.length > 0 ? (
        <VictoryChart theme={VictoryTheme.material} domainPadding={20}>
          <VictoryAxis style={{ tickLabels: { angle: 45, fill: '#cbd5e1', fontSize: 10 } }} />
          <VictoryAxis dependentAxis style={{ tickLabels: { fill: '#cbd5e1' } }} tickFormat={(t) => `${t}m`} />
          <VictoryBar data={data} x="habit" y="minutes" style={{ data: { fill: '#4f46e5' } }} />
        </VictoryChart>
      ) : (
        <Text style={styles.empty}>No time tracked yet.</Text>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Streaks</Text>
        {habits.map(h => (
          <Text key={h.habitId} style={styles.row}>{h.name}: {streaks[h.habitId] ?? 0} day(s)</Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Badge counts</Text>
        {habits.map(h => {
          const counts = badgeCounts[h.habitId] || {};
          const keys = Object.keys(counts);
          if (keys.length === 0) return null;
          return (
            <Text key={h.habitId} style={styles.row}>{h.name}: {keys.map(k => `${k}×${counts[k]}`).join(', ')}</Text>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  section: {
    backgroundColor: palette.card,
    borderRadius: metrics.radiusXL,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    padding: metrics.pad,
    marginTop: metrics.gap,
  },
  sectionTitle: { color: palette.textDim, fontSize: 14, marginBottom: metrics.gap, letterSpacing: 0.5 },
  row: { color: palette.text, marginBottom: 6 },
  empty: { color: palette.textDim },
  pill: { paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1, borderColor: palette.border, borderRadius: 999 },
  pillActive: { backgroundColor: palette.card },
  pillText: { color: palette.text },
});
