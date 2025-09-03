import React, { forwardRef, useImperativeHandle } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Switch } from 'react-native';
import SelectableChip from './SelectableChip';
import ColorPicker from './ColorPicker';
import { Habit, MetricKind } from '../types';
import { palette, HABIT_COLORS } from '../theme/palette';
import { metrics } from '../theme/metrics';
import { upsertHabit } from '../storage';
import { scheduleHabitReminders, cancelReminderIds } from '../lib/reminders';
import { DEFAULT_TIERS } from '../lib/badges';

const DOW = [0,1,2,3,4,5,6];
const DOW_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export type HabitFormV2Ref = { submit: () => void };

export default forwardRef<HabitFormV2Ref, { onSaved?: () => void; initial?: Habit | null; hideSubmit?: boolean }>(
function HabitFormV2({ onSaved, initial, hideSubmit }, ref) {
  const [name, setName] = React.useState(initial?.name ?? '');
  const [days, setDays] = React.useState<number[]>(initial?.days ?? [1,2,3,4,5]);
  const [metric, setMetric] = React.useState<MetricKind>(initial?.metric ?? (initial?.timed ? 'time' : 'count'));
  const [minMinutes, setMinMinutes] = React.useState<string>(initial?.minMinutes != null ? String(initial.minMinutes) : '5');
  const [unitLabel, setUnitLabel] = React.useState(initial?.unitLabel ?? 'unit');
  const [enableMilestones, setEnableMilestones] = React.useState(!!initial?.milestonesEnabled);
  const [tierValues, setTierValues] = React.useState<number[]>(initial?.milestoneTiers ? initial.milestoneTiers.map(t=>t.value) : DEFAULT_TIERS.map(t=>t.value));
  const [displayColor, setDisplayColor] = React.useState(initial?.displayColor ?? HABIT_COLORS[0]);
  const [reminders, setReminders] = React.useState<string[]>(initial?.reminders ?? []);
  const [rh, setRh] = React.useState('');
  const [rm, setRm] = React.useState('');
  const [mer, setMer] = React.useState<'AM'|'PM'>('AM');

  React.useEffect(() => {
    if (metric === 'count') {
      setMinMinutes('');
      if (!unitLabel) setUnitLabel('unit');
    }
  }, [metric, unitLabel]);

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
      metric,
      timed: metric === 'time',
      minMinutes: metric === 'time' ? Math.max(0, parseInt(minMinutes || '0',10)) : undefined,
      unitLabel: metric === 'count' ? (unitLabel.trim() || 'unit') : undefined,
      reminders,
      displayColor,
      milestonesEnabled: enableMilestones,
      milestoneTiers: enableMilestones ? ['red','yellow','green','blue'].map((label, i) => ({ value: Math.max(0, tierValues[i] || 0), label: label as any })) : undefined,
    };

    if (initial?.reminderIds?.length) await cancelReminderIds(initial.reminderIds);
    const ids = await scheduleHabitReminders(habit);
    habit.reminderIds = ids;

    await upsertHabit(habit);
    if (!initial) {
      setName('');
      setDays([1,2,3,4,5]);
      setMetric('time');
      setMinMinutes('5');
      setUnitLabel('unit');
      setEnableMilestones(false);
      setTierValues(DEFAULT_TIERS.map(t=>t.value));
      setDisplayColor(HABIT_COLORS[0]);
      setReminders([]);
    }
    onSaved?.();
  };

  useImperativeHandle(ref, () => ({ submit: save }), [save]);

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

      <Text style={styles.label}>Metric</Text>
      <View style={styles.daysWrap}>
        {(['time','count'] as const).map(m => (
          <SelectableChip key={m} label={m==='time' ? 'Time' : 'Count'} selected={metric===m} onPress={()=>setMetric(m)} />
        ))}
      </View>

      {metric === 'time' ? (
        <View style={{ gap: 8 }}>
          <Text style={styles.label}>Min minutes</Text>
          <TextInput
            value={minMinutes}
            onChangeText={setMinMinutes}
            keyboardType="number-pad"
            placeholder="5"
            placeholderTextColor={palette.textDim}
            style={styles.input}
          />
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          <Text style={styles.label}>Unit label</Text>
          <TextInput
            value={unitLabel}
            onChangeText={setUnitLabel}
            placeholder="word"
            placeholderTextColor={palette.textDim}
            style={styles.input}
          />
        </View>
      )}

      <View style={styles.switchRow}>
        <Text style={styles.switchText}>Milestones</Text>
        <Switch value={enableMilestones} onValueChange={(v)=>{ if(v && tierValues.length===0) setTierValues(DEFAULT_TIERS.map(t=>t.value)); setEnableMilestones(v); }} />
      </View>
      {enableMilestones && (
        <View style={{ gap: 8 }}>
          {['red','yellow','green','blue'].map((label,i)=> (
            <View key={label} style={styles.milestoneRow}>
              <TextInput
                value={String(tierValues[i] ?? 0)}
                onChangeText={t=>setTierValues(prev=>prev.map((v,idx)=>idx===i?Math.max(0, parseInt(t||'0',10)):v))}
                keyboardType="number-pad"
                style={[styles.input, styles.milestoneMinutes]}
                placeholder={metric==='time' ? 'min' : 'units'}
                placeholderTextColor={palette.textDim}
              />
              <Text style={styles.milestoneBadge}>{label}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.label}>Color</Text>
      <ColorPicker value={displayColor} onChange={setDisplayColor} />

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
  milestoneBadge: { color: palette.text, alignSelf:'center' },
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
