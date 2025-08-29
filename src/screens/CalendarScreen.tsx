import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import dayjs from 'dayjs';
import HabitCalendar from '../components/HabitCalendar';
import { useHabitStore, ISODate } from '../store/habits';
import { palette } from '../theme/palette';
import { metrics } from '../theme/metrics';

export default function CalendarScreen() {
  const dayView = useHabitStore((s) => s.dayView);
  const [date, setDate] = React.useState<ISODate>(dayjs().format('YYYY-MM-DD') as ISODate);
  const { due, logs } = dayView(date);

  const statusOf = (id: string) => logs.find((l) => l.habitId === id)?.status ?? 'pending';

  return (
    <View style={styles.container}>
      <HabitCalendar onSelectDate={setDate} />
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{dayjs(date).format('ddd, MMM D')}</Text>
        <FlatList
          data={due}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.label}>{item.name}</Text>
              <Text style={styles.status}>{statusOf(item.id)}</Text>
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
  empty: { color: palette.textDim },
});

