import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import dayjs from 'dayjs';
import HabitCalendar from '../components/HabitCalendar';
import { ISODate } from '../store/habits';
import { palette } from '../theme/palette';
import { metrics } from '../theme/metrics';
import { useHabitsV2 } from '../hooks/useHabitsV2';

export default function CalendarScreen() {
  const [date, setDate] = React.useState<ISODate>(dayjs().format('YYYY-MM-DD') as ISODate);
  const { logs, dueHabits } = useHabitsV2();
  const due = dueHabits(date);
  const statusOf = (habitId: string) => !!logs.find(l => l.habitId === habitId)?.completed;
  const badgeOf = (habitId: string) => logs.find(l => l.habitId === habitId)?.badge;

  return (
    <View style={styles.container}>
      <HabitCalendar onSelectDate={setDate} />
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{dayjs(date).format('ddd, MMM D')}</Text>
        <FlatList
          data={due}
          keyExtractor={(item) => item.habitId}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.label}>{item.name}</Text>
              <Text style={styles.status}>{statusOf(item.habitId) ? 'completed' : 'incomplete'}</Text>
              {badgeOf(item.habitId) ? <Text style={styles.badge}>🏅 {badgeOf(item.habitId)}</Text> : null}
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No habits due</Text>}
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
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  label: { color: palette.text },
  status: { color: palette.textDim },
  badge: { color: palette.text, marginLeft: 8 },
  empty: { color: palette.textDim },
});
