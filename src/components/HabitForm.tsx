import React from 'react';
import { View, TextInput, Pressable, Text, StyleSheet } from 'react-native';
import { useHabitStore } from '../store/habits';
import { palette } from '../theme/palette';
import { metrics } from '../theme/metrics';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function HabitForm({ onSaved }: { onSaved: () => void }) {
  const add = useHabitStore((s) => s.addHabit);
  const [name, setName] = React.useState('');
  const [freq, setFreq] = React.useState<'daily' | 'weeklyDays'>('daily');
  const [days, setDays] = React.useState<number[]>([]);

  const toggleDay = (i: number) => setDays((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));

  const save = () => {
    if (!name.trim()) return;
    add({ name, frequency: freq, daysOfWeek: freq === 'weeklyDays' ? days : undefined, goalType: 'check', reminders: ['20:30'] });
    setName(''); setFreq('daily'); setDays([]);
    onSaved();
  };

  return (
    <View style={styles.wrap}>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Habit name"
        placeholderTextColor={palette.textDim}
        style={styles.input}
      />
      <View style={styles.row}>
        {(['daily', 'weeklyDays'] as const).map((f) => (
          <Pressable key={f} onPress={() => setFreq(f)} style={[styles.pill, freq === f && styles.pillActive]}>
            <Text style={styles.pillText}>{f === 'daily' ? 'Every day' : 'Specific days'}</Text>
          </Pressable>
        ))}
      </View>
      {freq === 'weeklyDays' && (
        <View style={styles.daysWrap}>
          {DOW.map((label, i) => (
            <Pressable key={i} onPress={() => toggleDay(i)} style={[styles.day, days.includes(i) && styles.dayActive]}>
              <Text style={styles.dayText}>{label}</Text>
            </Pressable>
          ))}
        </View>
      )}
      <Pressable onPress={save} style={styles.saveBtn}>
        <Text style={styles.saveText}>Save Habit</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: metrics.gap },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    backgroundColor: palette.card,
    color: palette.text,
    padding: metrics.pad,
    borderRadius: metrics.radius,
  },
  row: { flexDirection: 'row', gap: metrics.gap },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: 'transparent',
    borderRadius: 999,
  },
  pillActive: { backgroundColor: palette.card },
  pillText: { color: palette.text },
  daysWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  day: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 999,
  },
  dayActive: { backgroundColor: palette.card },
  dayText: { color: palette.text },
  saveBtn: {
    backgroundColor: palette.accentEnd,
    padding: metrics.pad,
    borderRadius: metrics.radius,
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontWeight: '600' },
});

export default HabitForm;

