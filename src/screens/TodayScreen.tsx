import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import dayjs from 'dayjs';
import HabitItem from '../components/HabitItem';
import StreakCounter from '../components/StreakCounter';
import { palette } from '../theme/palette';
import { metrics } from '../theme/metrics';
import { useHabitsV2 } from '../hooks/useHabitsV2';
import { HabitV2 } from '../types/v2';
import { useRunningTimers } from '../hooks/useRunningTimers';
import { msToMMSS } from '../utils/time';
import { useOverallStreakV2 } from '../hooks/useStreaksV2';
import Screen from '../components/Screen';

export default function TodayScreen() {
  const iso = dayjs().format('YYYY-MM-DD');
  const { habits, dueHabits, statusOf, markCompleted, refreshKey } = useHabitsV2();
  const due: HabitV2[] = dueHabits(iso);
  const { runningTimers, startTimer, stopTimer, getElapsedMs } = useRunningTimers({
    habits,
    onAutoComplete: (habitId, minutes, badge) => {
      // auto-mark complete when threshold met
      // Note: markCompleted persists the log and triggers refreshKey changes
      markCompleted({ habitId, completed: true, duration: minutes, badge });
    },
  });
  const streak = useOverallStreakV2(habits, refreshKey);

  const badgeFor = (habit: HabitV2, minutes: number) => {
    if (!habit.milestones || habit.milestones.length === 0) return undefined;
    const eligible = habit.milestones
      .filter(m => minutes >= m.minutes)
      .sort((a,b)=> b.minutes - a.minutes)[0];
    return eligible?.badge;
  };

  return (
    <Screen style={styles.container}>
      <StreakCounter streak={streak} />
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today</Text>
        <FlatList
          data={due}
          keyExtractor={(item) => item.habitId}
          scrollEnabled={false}
          renderItem={({ item }) => {
            const completed = !!statusOf(item.habitId);
            const running = !!runningTimers[item.habitId];
            return (
              <View style={{ gap: 8 }}>
                <HabitItem
                  label={item.name}
                  checked={completed}
                  onToggle={() => {
                    if (!item.useTimer) {
                      // toggle completion for non-timer habits
                      markCompleted({ habitId: item.habitId, completed: !completed, duration: !completed ? (item.minTime ?? 0) : 0 });
                    }
                  }}
                />
                {item.useTimer && (
                  <View style={styles.timerRow}>
                    {!running ? (
                      <Pressable onPress={() => startTimer(item.habitId)} style={styles.timerBtn}><Text style={styles.timerText}>Start</Text></Pressable>
                    ) : (
                      <Pressable onPress={() => {
                        const ms = getElapsedMs(item.habitId);
                        const minutes = Math.max(0, Math.round(ms / 60000));
                        const ok = item.minTime ? minutes >= item.minTime : true;
                        const badge = badgeFor(item, minutes);
                        stopTimer(item.habitId, { saveAsCompleted: ok, minutesOverride: minutes, badge });
                      }} style={styles.timerBtnStop}><Text style={styles.timerText}>Stop & Save</Text></Pressable>
                    )}
                    <Text style={styles.timerHint}>
                      {item.minTime != null ? `Min: ${item.minTime}m • ` : ''}{msToMMSS(getElapsedMs(item.habitId))}
                    </Text>
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
});
