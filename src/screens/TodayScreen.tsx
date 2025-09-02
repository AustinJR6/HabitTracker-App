import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import dayjs from 'dayjs';
import HabitItem from '../components/HabitItem';
import StreakCounter from '../components/StreakCounter';
import { palette } from '../theme/palette';
import { metrics } from '../theme/metrics';
import { useHabitsV2 } from '../hooks/useHabitsV2';
import { Habit } from '../types';
import { useRunningTimers } from '../hooks/useRunningTimers';
import { msToMMSS } from '../utils/time';
import { useOverallStreakV2 } from '../hooks/useStreaksV2';
import Screen from '../components/Screen';
import { computeBadge, DEFAULT_BADGE_TIERS } from '../lib/badges';

export default function TodayScreen() {
  const iso = dayjs().format('YYYY-MM-DD');
  const { habits, logs, dueHabits, statusOf, markCompleted, refreshKey } = useHabitsV2();
  const due: Habit[] = dueHabits(iso);
  const { runningTimers, startTimer, stopTimer, getElapsedMs } = useRunningTimers();
  const streak = useOverallStreakV2(habits, refreshKey);

  return (
    <Screen style={styles.container}>
      <StreakCounter streak={streak} />
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today</Text>
        <FlatList
          data={due}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => {
            const completed = !!statusOf(item.id);
            const running = !!runningTimers[item.id];
            const todayLog = logs.find(l => l.habitId === item.id);
            const accumulated = todayLog?.durationMinutes ?? 0;
            const currentBadge = todayLog?.lastBadge;
            return (
              <View style={{ gap: 8 }}>
                <HabitItem
                  label={item.name}
                  checked={completed}
                  onToggle={() => {
                    if (!item.timed) {
                      // toggle completion for non-timer habits
                      markCompleted({ habitId: item.id, completed: !completed, durationMinutes: !completed ? (item.minMinutes ?? 0) : 0 });
                    }
                  }}
                />
                {item.timed && (
                  <View style={styles.timerRow}>
                    {!running ? (
                      <Pressable onPress={() => startTimer(item.id)} style={styles.timerBtn}><Text style={styles.timerText}>Start</Text></Pressable>
                    ) : (
                      <Pressable onPress={() => {
                        const ms = getElapsedMs(item.id);
                        const minutes = Math.max(0, Math.round(ms / 60000));
                        stopTimer(item.id);
                        const total = accumulated + minutes;
                        const badge = computeBadge(total, item.badgeTiers ?? DEFAULT_BADGE_TIERS);
                        const done = item.minMinutes != null ? total >= item.minMinutes : true;
                        markCompleted({ habitId: item.id, completed: done, durationMinutes: total, badge });
                      }} style={styles.timerBtnStop}><Text style={styles.timerText}>Stop & Save</Text></Pressable>
                    )}
                    <Text style={styles.timerHint}>
                      {item.minMinutes != null ? `Min: ${item.minMinutes}m · ` : ''}{running ? msToMMSS(getElapsedMs(item.id)) : msToMMSS(accumulated * 60000)}
                    </Text>
                    {currentBadge ? <Text style={styles.badge}>🏅 {currentBadge}</Text> : null}
                  </View>
                )}
              </View>
            );
          }}
          ListEmptyComponent={<Text style={styles.empty}>No habits due today.</Text>}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: metrics.gap },
  section: {
    backgroundColor: palette.card,
    borderRadius: metrics.radiusXL,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    padding: metrics.pad,
  },
  sectionTitle: { color: palette.textDim, fontSize: 14, marginBottom: metrics.gap, letterSpacing: 0.5 },
  empty: { color: palette.textDim, paddingVertical: metrics.pad },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timerBtn: { backgroundColor: palette.accentEnd, paddingVertical: 8, paddingHorizontal: 12, borderRadius: metrics.radius },
  timerBtnStop: { backgroundColor: '#dc2626', paddingVertical: 8, paddingHorizontal: 12, borderRadius: metrics.radius },
  timerText: { color: '#fff' },
  timerHint: { color: palette.textDim },
  badge: { color: palette.text },
});
