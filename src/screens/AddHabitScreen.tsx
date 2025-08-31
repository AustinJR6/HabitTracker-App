import React from 'react';
import { StyleSheet, Alert, FlatList, Text, Pressable, View } from 'react-native';
import HabitFormV2, { HabitFormV2Ref } from '../components/HabitFormV2';
import { palette } from '../theme/palette';
import { metrics } from '../theme/metrics';
import { useHabitsV2 } from '../hooks/useHabitsV2';
import { HabitV2 } from '../types/v2';
import Screen from '../components/Screen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AddHabitScreen() {
  const { habits, removeHabit } = useHabitsV2();
  const [editing, setEditing] = React.useState<HabitV2 | null>(null);
  const insets = useSafeAreaInsets();
  const formRef = React.useRef<HabitFormV2Ref>(null);

  return (
    <Screen
      style={styles.container}
      scrollProps={{
        keyboardDismissMode: 'on-drag',
        keyboardShouldPersistTaps: 'handled',
        contentContainerStyle: { paddingBottom: 140 + (insets?.bottom ?? 0) },
      }}
    >
      <HabitFormV2 ref={formRef} hideSubmit initial={editing} onSaved={() => {
        if (editing) { Alert.alert('Updated', 'Habit updated.'); setEditing(null); }
        else Alert.alert('Saved', 'Habit added.');
      }} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Habits</Text>
        <FlatList
          data={habits}
          keyExtractor={(item) => item.habitId}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>{item.days.join(' · ')}{item.useTimer && (item.minTime != null ? `  •  min ${item.minTime}m` : '')}</Text>
              </View>
              <Pressable onPress={() => setEditing(item)} style={styles.btn}><Text style={styles.btnText}>Edit</Text></Pressable>
              <Pressable onPress={() => {
                Alert.alert('Delete Habit', `Delete "${item.name}"?`, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => removeHabit(item.habitId) },
                ]);
              }} style={[styles.btn, styles.btnDanger]}><Text style={styles.btnText}>Delete</Text></Pressable>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No habits yet.</Text>}
        />
      </View>
      {/* Spacer ensures scroll past last input */}
      <View style={{ height: 160 }} />

      {/* Sticky Save Bar */}
      <View style={[styles.saveBar, { paddingBottom: 12 + (insets?.bottom ?? 0) }]}>
        <Pressable onPress={() => formRef.current?.submit()} style={styles.saveBtnSticky}>
          <Text style={styles.saveBtnText}>{editing ? 'Update Habit' : 'Save Habit'}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: metrics.gap, backgroundColor: 'transparent' },
  section: {
    marginTop: metrics.gap,
    backgroundColor: palette.card,
    borderRadius: metrics.radiusXL,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    padding: metrics.pad,
  },
  sectionTitle: { color: palette.textDim, fontSize: 14, marginBottom: metrics.gap, letterSpacing: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  name: { color: palette.text, fontWeight: '600' },
  meta: { color: palette.textDim, marginTop: 2 },
  btn: { backgroundColor: palette.accentEnd, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  btnDanger: { backgroundColor: '#dc2626' },
  btnText: { color: '#fff' },
  empty: { color: palette.textDim },
  saveBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
    borderRadius: 12,
    elevation: 4,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    backgroundColor: 'rgba(17,24,39,0.98)',
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  saveBtnSticky: {
    backgroundColor: palette.accentEnd,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '700' },
});
