import React, { forwardRef, useImperativeHandle } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import SelectableChip from './SelectableChip';
import { HabitV2, Milestone, Weekday } from '../types/v2';
import { palette } from '../theme/palette';
import { metrics } from '../theme/metrics';
import { upsertHabitV2 } from '../services/storageV2';

const DOW: Weekday[] = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export type HabitFormV2Ref = { submit: () => void };

export default forwardRef<HabitFormV2Ref, { onSaved?: () => void; initial?: HabitV2 | null; hideSubmit?: boolean }>(function HabitFormV2(
  { onSaved, initial, hideSubmit },
  ref
) {
  const [name, setName] = React.useState(initial?.name ?? '');
  const [days, setDays] = React.useState<Weekday[]>(initial?.days ?? ['Mon','Tue','Wed','Thu','Fri']);
  const [useTimer, setUseTimer] = React.useState(!!initial?.useTimer);
  const [minTime, setMinTime] = React.useState<string>(initial?.minTime != null ? String(initial.minTime) : '15');
  const [enableMilestones, setEnableMilestones] = React.useState(!!initial?.milestones?.length);
  const [milestones, setMilestones] = React.useState<Milestone[]>(initial?.milestones ?? [
    { minutes: 5, badge: 'red' },
    { minutes: 10, badge: 'yellow' },
    { minutes: 15, badge: 'green' },
    { minutes: 30, badge: 'blue' },
  ]);
  const [nHour, setNHour] = React.useState<string>(initial?.notificationTime?.hour != null ? String(initial.notificationTime.hour) : '');
  const [nMinute, setNMinute] = React.useState<string>(initial?.notificationTime?.minute != null ? String(initial.notificationTime.minute) : '');

  const toggleDay = (w: Weekday) => {
    setDays(prev => prev.includes(w) ? prev.filter(x => x !== w) : [...prev, w]);
  };

  const toggle = (flag: boolean, setter: (v: boolean) => void) => setter(!flag);

  const save = async () => {
    if (!name.trim()) return;
    const id = initial?.habitId ?? ((global as any).crypto?.randomUUID?.() ?? String(Date.now() + Math.random()));
    const habit: HabitV2 = {
      habitId: id,
      name: name.trim(),
      days: days.length ? days.sort((a,b)=> DOW.indexOf(a)-DOW.indexOf(b)) : ['Mon','Tue','Wed','Thu','Fri'],
      useTimer,
      minTime: useTimer ? Math.max(0, parseInt(minTime || '0', 10)) : undefined,
      milestones: enableMilestones ? milestones.slice().sort((a,b)=>a.minutes-b.minutes) : undefined,
      notificationTime: (nHour !== '' && nMinute !== '') ? { hour: Math.min(23, Math.max(0, parseInt(nHour,10)||0)), minute: Math.min(59, Math.max(0, parseInt(nMinute,10)||0)) } : null,
    };
    await upsertHabitV2(habit);
    if (!initial) {
      setName(''); setDays(['Mon','Tue','Wed','Thu','Fri']); setUseTimer(false); setMinTime('15'); setEnableMilestones(false);
      setNHour(''); setNMinute('');
    }
    onSaved?.();
  };

  useImperativeHandle(ref, () => ({ submit: save }), [save]);

  const updateMilestone = (idx: number, patch: Partial<Milestone>) => {
    setMilestones(prev => prev.map((m,i)=> i===idx ? { ...m, ...patch } : m));
  };
  const addMilestone = () => setMilestones(prev => [...prev, { minutes: 1, badge: 'badge' }]);
  const removeMilestone = (idx: number) => setMilestones(prev => prev.filter((_,i)=> i!==idx));

  return (
    <View style={styles.wrap}>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Habit name"
        placeholderTextColor={palette.textDim}
        style={styles.input}
      />

      <Text style={styles.label}>Days</Text>
      <View style={styles.daysWrap}>
        {DOW.map((d) => (
          <SelectableChip key={d} label={d} selected={days.includes(d)} onPress={() => toggleDay(d)} />
        ))}
      </View>

      <Pressable onPress={() => toggle(useTimer, setUseTimer)} style={styles.switchRow}>
        <Text style={styles.switchText}>Track time for this habit?</Text>
        <Text style={styles.switchVal}>{useTimer ? 'On' : 'Off'}</Text>
      </Pressable>

      {useTimer && (
        <View style={{ gap: 8 }}>
          <Text style={styles.label}>Minimum time required (minutes)</Text>
          <TextInput
            value={minTime}
            onChangeText={setMinTime}
            keyboardType="number-pad"
            placeholder="15"
            placeholderTextColor={palette.textDim}
            style={styles.input}
          />

          <Pressable onPress={() => toggle(enableMilestones, setEnableMilestones)} style={styles.switchRow}>
            <Text style={styles.switchText}>Enable milestone badges?</Text>
            <Text style={styles.switchVal}>{enableMilestones ? 'On' : 'Off'}</Text>
          </Pressable>
          {enableMilestones && (
            <View style={{ gap: 8 }}>
              {milestones.map((m, i) => (
                <View key={i} style={styles.milestoneRow}>
                  <TextInput
                    value={String(m.minutes)}
                    onChangeText={(t)=> updateMilestone(i, { minutes: Math.max(0, parseInt(t||'0', 10)) })}
                    keyboardType="number-pad"
                    style={[styles.input, styles.milestoneMinutes]}
                    placeholder="min"
                    placeholderTextColor={palette.textDim}
                  />
                  <TextInput
                    value={m.badge}
                    onChangeText={(t)=> updateMilestone(i, { badge: t })}
                    style={[styles.input, styles.milestoneBadge]}
                    placeholder="badge color"
                    placeholderTextColor={palette.textDim}
                  />
                  <Pressable onPress={() => removeMilestone(i)} style={styles.removeBtn}><Text style={styles.removeText}>✕</Text></Pressable>
                </View>
              ))}
              <Pressable onPress={addMilestone} style={styles.addBtn}><Text style={styles.addText}>Add milestone</Text></Pressable>
            </View>
          )}
        </View>
      )}

      <Text style={styles.label}>Notification time (optional)</Text>
      <View style={styles.row}>
        <TextInput
          value={nHour}
          onChangeText={setNHour}
          keyboardType="number-pad"
          placeholder="HH"
          placeholderTextColor={palette.textDim}
          style={[styles.input, styles.hh]}
        />
        <Text style={{ color: palette.text, alignSelf: 'center' }}>:</Text>
        <TextInput
          value={nMinute}
          onChangeText={setNMinute}
          keyboardType="number-pad"
          placeholder="MM"
          placeholderTextColor={palette.textDim}
          style={[styles.input, styles.hh]}
        />
      </View>

      {!hideSubmit && (
        <Pressable onPress={save} style={styles.saveBtn}>
          <Text style={styles.saveText}>{initial ? 'Update Habit' : 'Save Habit'}</Text>
        </Pressable>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: metrics.gap },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    backgroundColor: palette.card,
    color: palette.text,
    padding: metrics.pad,
    borderRadius: metrics.radius,
    minWidth: 60,
  },
  label: { color: palette.textDim, fontSize: 14 },
  daysWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  switchText: { color: palette.text },
  switchVal: { color: palette.textDim },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hh: { width: 80 },
  saveBtn: {
    backgroundColor: palette.accentEnd,
    padding: metrics.pad,
    borderRadius: metrics.radius,
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontWeight: '600' },
  milestoneRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  milestoneMinutes: { width: 90 },
  milestoneBadge: { flex: 1 },
  addBtn: { alignSelf: 'flex-start', backgroundColor: 'transparent', borderWidth: 1, borderColor: palette.border, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  addText: { color: palette.text },
  removeBtn: { paddingHorizontal: 8, paddingVertical: 6 },
  removeText: { color: palette.textDim, fontSize: 16 },
});
