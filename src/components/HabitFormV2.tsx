import React, { forwardRef, useImperativeHandle } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Switch } from 'react-native';
import SelectableChip from './SelectableChip';
import { Habit, BadgeTier } from '../types';
import { palette } from '../theme/palette';
import { metrics } from '../theme/metrics';
import { upsertHabit } from '../storage';
import { scheduleHabitReminders, cancelReminderIds } from '../lib/reminders';
import { DEFAULT_BADGE_TIERS } from '../lib/badges';

const DOW = [0,1,2,3,4,5,6];
const DOW_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export type HabitFormV2Ref = { submit: () => void };

export default forwardRef<HabitFormV2Ref, { onSaved?: () => void; initial?: Habit | null; hideSubmit?: boolean }>(
function HabitFormV2({ onSaved, initial, hideSubmit }, ref) {
  const [name, setName] = React.useState(initial?.name ?? '');
  const [days, setDays] = React.useState<number[]>(initial?.days ?? [1,2,3,4,5]);
  const [timed, setTimed] = React.useState(!!initial?.timed);
  const [minMinutes, setMinMinutes] = React.useState<string>(initial?.minMinutes != null ? String(initial.minMinutes) : '5');
  const [enableBadges, setEnableBadges] = React.useState(!!initial?.badgeTiers?.length);
  const [badgeTiers, setBadgeTiers] = React.useState<BadgeTier[]>(initial?.badgeTiers ?? DEFAULT_BADGE_TIERS);
  const [reminders, setReminders] = React.useState<string[]>(initial?.reminders ?? []);
  const [rh, setRh] = React.useState('');
  const [rm, setRm] = React.useState('');
  const [mer, setMer] = React.useState<'AM'|'PM'>('AM');

  const toggleDay = (d: number) => {
    setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  };

  const addReminder = () => {
    const h = parseInt(rh,10);
    const m = parseInt(rm,10);
    if (!Number.isFinite(h) || h < 1 || h > 12) return;
    if (!Number.isFinite(m) || m < 0 || m > 59) return;
    const hh = String(h).padStart(2,'0');
    const mm = String(m).padStart(2,'0');
    const formatted = `${hh}:${mm} ${mer}`;
    if (reminders.includes(formatted)) return;
    setReminders(prev => [...prev, formatted]);
    setRh(''); setRm('');
  };

  const removeReminder = (r: string) => setReminders(prev => prev.filter(x => x !== r));

  const save = async () => {
    if (!name.trim()) return;
    const id = initial?.id ?? ((global as any).crypto?.randomUUID?.() ?? String(Date.now() + Math.random()));
    const habit: Habit = {
      id,
      name: name.trim(),
      days: days.length ? days.sort((a,b)=>a-b) : [1,2,3,4,5],
      timed,
      minMinutes: timed ? Math.max(0, parseInt(minMinutes || '0',10)) : undefined,
      reminders,
      badgeTiers: enableBadges ? badgeTiers.slice().sort((a,b)=>a.minutes-b.minutes) : undefined,
    };

    if (initial?.reminderIds?.length) await cancelReminderIds(initial.reminderIds);
    const ids = await scheduleHabitReminders(habit);
    habit.reminderIds = ids;

    await upsertHabit(habit);
    if (!initial) {
      setName(''); setDays([1,2,3,4,5]); setTimed(false); setMinMinutes('5'); setEnableBadges(false); setBadgeTiers(DEFAULT_BADGE_TIERS); setReminders([]);
    }
    onSaved?.();
  };

  useImperativeHandle(ref, () => ({ submit: save }), [save]);

  const updateBadgeTier = (idx: number, patch: Partial<BadgeTier>) => {
    setBadgeTiers(prev => prev.map((b,i) => i===idx ? { ...b, ...patch } : b));
  };
  const addBadgeTier = () => setBadgeTiers(prev => [...prev, { minutes: 1, label: 'red' }]);
  const removeBadgeTier = (idx: number) => setBadgeTiers(prev => prev.filter((_,i)=>i!==idx));

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
        {DOW.map(d => (
          <SelectableChip key={d} label={DOW_LABELS[d]} selected={days.includes(d)} onPress={() => toggleDay(d)} />
        ))}
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchText}>Track time for this habit?</Text>
        <Switch value={timed} onValueChange={setTimed} />
      </View>

      {timed && (
        <View style={{ gap: 8 }}>
          <Text style={styles.label}>Minimum time required (minutes)</Text>
          <TextInput
            value={minMinutes}
            onChangeText={setMinMinutes}
            keyboardType="number-pad"
            placeholder="5"
            placeholderTextColor={palette.textDim}
            style={styles.input}
          />
          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Enable milestone badges?</Text>
            <Switch value={enableBadges} onValueChange={setEnableBadges} />
          </View>
          {enableBadges && (
            <View style={{ gap: 8 }}>
              {badgeTiers.map((b,i)=> (
                <View key={i} style={styles.milestoneRow}>
                  <TextInput
                    value={String(b.minutes)}
                    onChangeText={t=>updateBadgeTier(i,{ minutes: Math.max(0, parseInt(t||'0',10)) })}
                    keyboardType="number-pad"
                    style={[styles.input, styles.milestoneMinutes]}
                    placeholder="min"
                    placeholderTextColor={palette.textDim}
                  />
                  <TextInput
                    value={b.label}
                    onChangeText={t=>updateBadgeTier(i,{ label: t as any })}
                    style={[styles.input, styles.milestoneBadge]}
                    placeholder="badge"
                    placeholderTextColor={palette.textDim}
                  />
                  <Pressable onPress={()=>removeBadgeTier(i)} style={styles.removeBtn}><Text style={styles.removeText}>✕</Text></Pressable>
                </View>
              ))}
              <Pressable onPress={addBadgeTier} style={styles.addBtn}><Text style={styles.addText}>Add milestone</Text></Pressable>
            </View>
          )}
        </View>
      )}

      <Text style={styles.label}>Reminders</Text>
      <View style={styles.remindersCard}>
        <View style={styles.reminderChips}>
          {reminders.map(r => (
            <View key={r} style={styles.reminderChip}>
              <Text style={styles.reminderText}>{r}</Text>
              <Pressable onPress={()=>removeReminder(r)} style={styles.reminderRemove}><Text style={styles.removeText}>✕</Text></Pressable>
            </View>
          ))}
        </View>
        <View style={styles.reminderRow}>
          <TextInput value={rh} onChangeText={setRh} keyboardType="number-pad" placeholder="HH" placeholderTextColor={palette.textDim} style={[styles.input, styles.hh]} />
          <Text style={{ color: palette.text, alignSelf:'center' }}>:</Text>
          <TextInput value={rm} onChangeText={setRm} keyboardType="number-pad" placeholder="MM" placeholderTextColor={palette.textDim} style={[styles.input, styles.hh]} />
          <View style={styles.amPm}>
            {(['AM','PM'] as const).map(p => (
              <Pressable key={p} onPress={()=>setMer(p)} style={[styles.amPmBtn, mer===p && styles.amPmBtnActive]}><Text style={styles.amPmText}>{p}</Text></Pressable>
            ))}
          </View>
          <Pressable onPress={addReminder} style={styles.addBtn}><Text style={styles.addText}>Add</Text></Pressable>
        </View>
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
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hh: { width: 80 },
  saveBtn: { backgroundColor: palette.accentEnd, padding: metrics.pad, borderRadius: metrics.radius, alignItems:'center' },
  saveText: { color: '#fff', fontWeight:'600' },
  milestoneRow: { flexDirection:'row', alignItems:'center', gap:8 },
  milestoneMinutes: { width:90 },
  milestoneBadge: { flex:1 },
  addBtn: { alignSelf:'flex-start', backgroundColor:'transparent', borderWidth:1, borderColor:palette.border, paddingHorizontal:10, paddingVertical:6, borderRadius:8 },
  addText: { color: palette.text },
  removeBtn: { paddingHorizontal:8, paddingVertical:6 },
  removeText: { color: palette.textDim, fontSize:16 },
  remindersCard: { gap:8 },
  reminderChips: { flexDirection:'row', flexWrap:'wrap', gap:8 },
  reminderChip: { flexDirection:'row', alignItems:'center', backgroundColor: palette.card, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.border, borderRadius:16, paddingHorizontal:10, paddingVertical:4 },
  reminderText: { color: palette.text },
  reminderRemove: { marginLeft:4 },
  reminderRow: { flexDirection:'row', alignItems:'center', gap:8, flexWrap:'wrap' },
  amPm: { flexDirection:'row', borderWidth:1, borderColor: palette.border, borderRadius:8, overflow:'hidden' },
  amPmBtn: { paddingHorizontal:10, paddingVertical:6, backgroundColor:'transparent' },
  amPmBtnActive: { backgroundColor: palette.card },
  amPmText: { color: palette.text },
});
