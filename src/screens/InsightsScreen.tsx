import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import dayjs from 'dayjs';
import {
  VictoryChart,
  VictoryBar,
  VictoryAxis,
  VictoryGroup,
  VictoryLine,
  VictoryTooltip,
} from 'victory-native';
import { getHabitsV2, getLogsByDateV2 } from '../services/storageV2';
import { HabitV2 } from '../types/v2';
import { useOverallStreakV2, usePerHabitStreaksV2 } from '../hooks/useStreaksV2';
import Screen from '../components/Screen';
import { useHabitsV2 } from '../hooks/useHabitsV2';
import { palette } from '../theme/palette';
import { metrics } from '../theme/metrics';

// util to coerce/clean chart data
const toNumber = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const safeData = <T extends { x?: any; y?: any }>(arr: T[] | undefined | null) =>
  Array.isArray(arr)
    ? arr
        .filter((d) => d && d.x !== undefined && d.y !== undefined)
        .map((d) => ({ x: d.x, y: toNumber(d.y) }))
    : [];

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

  const weekRaw = habits.map((h) => ({ x: h.name, y: totals[h.habitId] ?? 0 }));
  const monthRaw: typeof weekRaw = [];
  const weekData = safeData(weekRaw);
  const monthData = safeData(monthRaw);

  if (!weekData.length && !monthData.length) {
    return (
      <Screen style={styles.container}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>No insights yet</Text>
          <Text style={{ opacity: 0.7, textAlign: 'center' }}>
            Complete a habit to see your progress here.
          </Text>
        </View>
      </Screen>
    );
  }

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
      <VictoryChart
        domainPadding={{ x: 24, y: 12 }}
        padding={{ top: 24, bottom: 48, left: 48, right: 24 }}
      >
        <VictoryAxis
          style={{
            axis: { stroke: '#e2e8f0' },
            tickLabels: { fontSize: 12, padding: 6, fill: '#64748b' },
            grid: { stroke: '#f1f5f9' },
          }}
        />
        <VictoryAxis
          dependentAxis
          style={{
            axis: { stroke: '#e2e8f0' },
            tickLabels: { fontSize: 12, padding: 4, fill: '#64748b' },
            grid: { stroke: '#f1f5f9' },
          }}
        />
        <VictoryGroup>
          <VictoryBar
            data={weekData}
            labels={({ datum }: any) => `${datum.y}`}
            labelComponent={<VictoryTooltip constrainToVisibleArea />}
            style={{
              data: { opacity: 0.9, borderRadius: 4 },
              labels: { fontSize: 10 },
            }}
            barWidth={({ index }: any) => 16}
          />
        </VictoryGroup>
      </VictoryChart>

      {/* Optional trend line over month data */}
      {monthData.length > 0 && (
        <VictoryChart
          domainPadding={{ x: 12, y: 8 }}
          padding={{ top: 24, bottom: 48, left: 48, right: 24 }}
        >
          <VictoryAxis
            style={{
              axis: { stroke: '#e2e8f0' },
              tickLabels: { fontSize: 12, padding: 6, fill: '#64748b' },
              grid: { stroke: '#f1f5f9' },
            }}
          />
          <VictoryAxis
            dependentAxis
            style={{
              axis: { stroke: '#e2e8f0' },
              tickLabels: { fontSize: 12, padding: 4, fill: '#64748b' },
              grid: { stroke: '#f1f5f9' },
            }}
          />
          <VictoryLine
            data={monthData}
            interpolation="monotoneX"
            style={{ data: { strokeWidth: 2 } }}
          />
        </VictoryChart>
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
  pill: { paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1, borderColor: palette.border, borderRadius: 999 },
  pillActive: { backgroundColor: palette.card },
  pillText: { color: palette.text },
});

