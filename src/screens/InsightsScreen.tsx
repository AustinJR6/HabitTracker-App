import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import dayjs from 'dayjs';
import {
  VictoryChart,
  VictoryAxis,
  VictoryGroup,
  VictoryBar,
  VictoryTooltip,
} from 'victory-native';
import * as Victory from 'victory-native';
import { Habit, HabitLog, MetricKind } from '../types';
import { getHabits, getLogsByDate } from '../storage';
import Screen from '../components/Screen';
import { palette } from '../theme/palette';
import { metrics } from '../theme/metrics';
import { useHabitsV2 } from '../hooks/useHabitsV2';
import { useOverallStreakV2, usePerHabitStreaksV2 } from '../hooks/useStreaksV2';
import { buildDataset } from '../lib/insights';
import { formatMinutes } from '../lib/badges';

export default function InsightsScreen() {
  const [period, setPeriod] = React.useState<'week' | 'month'>('week');
  const [metricMode, setMetricMode] = React.useState<MetricKind>('time');
  const [habits, setHabits] = React.useState<Habit[]>([]);
  const [logs, setLogs] = React.useState<HabitLog[]>([]);
  const [badgeCounts, setBadgeCounts] = React.useState<Record<string, Record<string, number>>>({});
  const { refreshKey } = useHabitsV2();
  const streaks = usePerHabitStreaksV2(habits, refreshKey);
  const overall = useOverallStreakV2(habits, refreshKey);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const hs = await getHabits();
      const to = dayjs();
      const from = to.subtract(period === 'week' ? 6 : 29, 'day');
      const collected: HabitLog[] = [];
      const badges: Record<string, Record<string, number>> = {};
      for (let d = from; d.isBefore(to) || d.isSame(to, 'day'); d = d.add(1, 'day')) {
        const ymd = d.format('YYYY-MM-DD');
        const dayLogs = await getLogsByDate(ymd);
        collected.push(...dayLogs);
        for (const l of dayLogs) {
          if (l.lastBadge) {
            badges[l.habitId] = badges[l.habitId] || {};
            badges[l.habitId][l.lastBadge] = (badges[l.habitId][l.lastBadge] || 0) + 1;
          }
        }
      }
      if (!cancelled) {
        setHabits(hs);
        setLogs(collected);
        setBadgeCounts(badges);
      }
    })();
    return () => { cancelled = true; };
  }, [period, refreshKey]);

  const { categories, series, unitLabel } = buildDataset(habits, logs, metricMode, period);
  const Zoom: any = (Victory as any).VictoryZoomContainer;
  const Legend: any = (Victory as any).VictoryLegend;
  const width = Math.max(360, categories.length * Math.max(80, series.length * 40));

  const chart = (
    <VictoryChart
      domainPadding={{ x: 24, y: 12 }}
      padding={{ top: 40, bottom: 48, left: 48, right: 24 }}
      containerComponent={Zoom ? <Zoom zoomDimension="x" /> : undefined}
      width={width}
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
        tickFormat={(t: number) =>
          metricMode === 'time' ? formatMinutes(Number(t)) : String(Math.round(Number(t)))
        }
        label={metricMode === 'count' && unitLabel ? unitLabel : undefined}
        style={{
          axis: { stroke: '#e2e8f0' },
          tickLabels: { fontSize: 12, padding: 4, fill: '#64748b' },
          grid: { stroke: '#f1f5f9' },
          axisLabel: { padding: 32, fill: '#64748b', fontSize: 12 },
        }}
      />
      <VictoryGroup offset={24}>
        {series.map((s) => (
          <VictoryBar
            key={s.habitId}
            data={s.points}
            barWidth={18}
            labels={({ datum }: any) =>
              metricMode === 'time'
                ? `${datum.habitName}\n${formatMinutes(datum.y)}`
                : `${datum.habitName}\n${datum.y} ${unitLabel ? unitLabel + (datum.y === 1 ? '' : 's') : ''}`
            }
            labelComponent={<VictoryTooltip constrainToVisibleArea />}
            style={{ data: { fill: s.color, opacity: 0.95, borderRadius: 4 }, labels: { fontSize: 10 } }}
          />
        ))}
      </VictoryGroup>
      {Legend && (
        <Legend
          x={220}
          y={-6}
          orientation="horizontal"
          gutter={12}
          data={series.map((s) => ({ name: s.habitName, symbol: { fill: s.color } }))}
          style={{ labels: { fontSize: 12 } }}
        />
      )}
    </VictoryChart>
  );

  const chartElement = Zoom ? chart : <ScrollView horizontal>{chart}</ScrollView>;

  return (
    <Screen style={styles.container}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={styles.sectionTitle}>Insights</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable onPress={() => setPeriod('week')} style={[styles.pill, period==='week' && styles.pillActive]}><Text style={styles.pillText}>Week</Text></Pressable>
          <Pressable onPress={() => setPeriod('month')} style={[styles.pill, period==='month' && styles.pillActive]}><Text style={styles.pillText}>Month</Text></Pressable>
        </View>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
        <Pressable onPress={() => setMetricMode('time')} style={[styles.pill, metricMode==='time' && styles.pillActive]}><Text style={styles.pillText}>Time</Text></Pressable>
        <Pressable onPress={() => setMetricMode('count')} style={[styles.pill, metricMode==='count' && styles.pillActive]}><Text style={styles.pillText}>Count</Text></Pressable>
      </View>
      {chartElement}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Streaks</Text>
        <Text style={styles.row}>Overall streak: {overall} day(s)</Text>
        {habits.map(h => (
          <Text key={h.id} style={styles.row}>{h.name}: {streaks[h.id] ?? 0} day(s)</Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Badge counts</Text>
        {habits.filter(h=>h.milestonesEnabled).map(h => {
          const counts = badgeCounts[h.id] || {};
          const keys = Object.keys(counts);
          if (keys.length === 0) return null;
          return (
            <Text key={h.id} style={styles.row}>{h.name}: {keys.map(k => `${k}×${counts[k]}`).join(', ')}</Text>
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
